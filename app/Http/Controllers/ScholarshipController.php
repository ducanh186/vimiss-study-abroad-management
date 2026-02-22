<?php

namespace App\Http\Controllers;

use App\Models\Scholarship;
use App\Models\ScholarshipRequest;
use App\Models\Application;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScholarshipController extends Controller
{
    /**
     * List scholarships (students see only active + not expired)
     */
    public function index(Request $request): JsonResponse
    {
        $query = Scholarship::with('university:id,name,country');
        $user = $request->user();

        if ($user->isStudent()) {
            $query->where('is_active', true);
        }

        if ($type = $request->query('type')) {
            $query->where('type', $type);
        }

        if ($search = $request->query('search')) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhereHas('university', fn ($uq) => $uq->where('name', 'like', "%{$search}%"));
            });
        }

        $scholarships = $query->orderBy('deadline')
            ->paginate($request->query('per_page', 15));

        // Mark expired for frontend
        $scholarships->getCollection()->transform(function ($s) {
            $s->is_expired = $s->isExpired();
            $s->is_quota_full = $s->isQuotaFull();
            return $s;
        });

        return response()->json($scholarships);
    }

    public function show(Scholarship $scholarship): JsonResponse
    {
        $scholarship->load('university');
        $scholarship->is_expired = $scholarship->isExpired();
        $scholarship->is_quota_full = $scholarship->isQuotaFull();

        return response()->json(['scholarship' => $scholarship]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'university_id' => ['required', 'exists:universities,id'],
            'name' => ['required', 'string', 'max:255'],
            'type' => ['required', 'in:CSC,CIS,self-funded,other'],
            'min_hsk_level' => ['sometimes', 'nullable', 'string'],
            'min_gpa' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:4'],
            'deadline' => ['sometimes', 'nullable', 'date'],
            'quota' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'requirements' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ]);

        $scholarship = Scholarship::create($validated);

        return response()->json([
            'message' => 'Scholarship created.',
            'scholarship' => $scholarship->load('university'),
        ], 201);
    }

    public function update(Request $request, Scholarship $scholarship): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'type' => ['sometimes', 'in:CSC,CIS,self-funded,other'],
            'min_hsk_level' => ['sometimes', 'nullable', 'string'],
            'min_gpa' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:4'],
            'deadline' => ['sometimes', 'nullable', 'date'],
            'quota' => ['sometimes', 'nullable', 'integer', 'min:1'],
            'requirements' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'description' => ['sometimes', 'nullable', 'string', 'max:5000'],
            'is_active' => ['sometimes', 'boolean'],
        ]);

        $scholarship->update($validated);

        return response()->json([
            'message' => 'Scholarship updated.',
            'scholarship' => $scholarship->fresh()->load('university'),
        ]);
    }

    public function destroy(Scholarship $scholarship): JsonResponse
    {
        $scholarship->delete();
        return response()->json(['message' => 'Scholarship deleted.']);
    }

    /**
     * Create a scholarship request for an application
     */
    public function createRequest(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'application_id' => ['required', 'exists:applications,id'],
            'scholarship_id' => ['required', 'exists:scholarships,id'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $scholarship = Scholarship::findOrFail($validated['scholarship_id']);

        // Check expired
        if ($scholarship->isExpired()) {
            return response()->json(['message' => 'This scholarship deadline has passed.'], 422);
        }

        // Check quota
        if ($scholarship->isQuotaFull()) {
            return response()->json(['message' => 'This scholarship quota is full.'], 422);
        }

        // Check application access
        $application = Application::findOrFail($validated['application_id']);
        $user = $request->user();
        if ($user->isMentor() && $application->mentor_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $scholarshipRequest = ScholarshipRequest::create([
            'application_id' => $validated['application_id'],
            'scholarship_id' => $validated['scholarship_id'],
            'requested_by' => $user->id,
            'status' => 'pending',
            'notes' => $validated['notes'] ?? null,
        ]);

        return response()->json([
            'message' => 'Scholarship request created.',
            'request' => $scholarshipRequest->load('scholarship'),
        ], 201);
    }
}
