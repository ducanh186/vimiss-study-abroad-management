<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\MentorStudentAssignment;
use App\Models\Notification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApplicationController extends Controller
{
    /**
     * List applications (filtered by role)
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Application::with(['student:id,name,email', 'mentor:id,name,email', 'university:id,name']);

        if ($user->isStudent()) {
            $query->where('student_id', $user->id);
        } elseif ($user->isMentor()) {
            $query->where('mentor_id', $user->id);
        }
        // admin/director/reviewer: see all

        // Filters
        if ($status = $request->query('status')) {
            $statuses = explode(',', $status);
            $query->whereIn('status', $statuses);
        }
        if ($type = $request->query('application_type')) {
            $query->where('application_type', $type);
        }
        if ($scholarshipType = $request->query('scholarship_type')) {
            $query->where('scholarship_type', $scholarshipType);
        }
        if ($universityId = $request->query('university_id')) {
            $query->where('university_id', $universityId);
        }

        $applications = $query->orderByDesc('created_at')
            ->paginate($request->query('per_page', 15));

        return response()->json($applications);
    }

    /**
     * Show single application
     */
    public function show(Request $request, Application $application): JsonResponse
    {
        $user = $request->user();

        // Access control
        if ($user->isStudent() && $application->student_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        if ($user->isMentor() && $application->mentor_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $application->load([
            'student:id,name,email',
            'mentor:id,name,email',
            'university:id,name',
            'histories.changer:id,name',
            'documents',
            'scholarshipRequests.scholarship',
        ]);

        return response()->json(['application' => $application]);
    }

    /**
     * Mentor/Admin: create application for assigned student
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'student_id' => ['required', 'exists:users,id'],
            'application_type' => ['required', 'in:' . implode(',', Application::APPLICATION_TYPES)],
            'scholarship_type' => ['nullable', 'in:' . implode(',', Application::SCHOLARSHIP_TYPES)],
            'university_id' => ['nullable', 'exists:universities,id'],
            'major' => ['nullable', 'string', 'max:200'],
            'intake_term' => ['nullable', 'string', 'max:20'],
            'notes' => ['nullable', 'string', 'max:5000'],
        ]);

        // Check: mentor can only create for assigned students
        if ($user->isMentor()) {
            $isAssigned = MentorStudentAssignment::where('mentor_id', $user->id)
                ->where('student_id', $validated['student_id'])
                ->active()
                ->exists();

            if (!$isAssigned) {
                return response()->json([
                    'message' => 'You can only create applications for your assigned students.',
                ], 403);
            }
        }

        $application = Application::create([
            'student_id' => $validated['student_id'],
            'mentor_id' => $user->isMentor() ? $user->id : ($request->mentor_id ?? $user->id),
            'created_by' => $user->id,
            'status' => Application::STATUS_DRAFT,
            'application_type' => $validated['application_type'],
            'scholarship_type' => $validated['scholarship_type'] ?? null,
            'university_id' => $validated['university_id'] ?? null,
            'major' => $validated['major'] ?? null,
            'intake_term' => $validated['intake_term'] ?? null,
            'notes' => $validated['notes'] ?? null,
        ]);

        // Log creation
        $application->logChange($user->id, 'status', null, Application::STATUS_DRAFT, 'Application created');

        // Notify student
        Notification::notify($validated['student_id'], 'Application Created', 'A new application has been created for you.', 'application_status');

        return response()->json([
            'message' => 'Application created.',
            'application' => $application->load(['student:id,name,email', 'mentor:id,name,email', 'university:id,name']),
        ], 201);
    }

    /**
     * Mentor/Admin: update application fields and/or status
     */
    public function update(Request $request, Application $application): JsonResponse
    {
        $user = $request->user();

        // Access control
        if ($user->isMentor() && $application->mentor_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }
        if ($user->isStudent()) {
            return response()->json(['message' => 'Students cannot update applications.'], 403);
        }

        $validated = $request->validate([
            'status' => ['sometimes', 'in:' . implode(',', Application::STATUSES)],
            'application_type' => ['sometimes', 'in:' . implode(',', Application::APPLICATION_TYPES)],
            'scholarship_type' => ['sometimes', 'nullable', 'in:' . implode(',', Application::SCHOLARSHIP_TYPES)],
            'university_id' => ['sometimes', 'nullable', 'exists:universities,id'],
            'major' => ['sometimes', 'nullable', 'string', 'max:200'],
            'intake_term' => ['sometimes', 'nullable', 'string', 'max:20'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:5000'],
        ]);

        // Status transition validation
        if (isset($validated['status']) && $validated['status'] !== $application->status) {
            if (!$application->canTransitionTo($validated['status'])) {
                return response()->json([
                    'message' => "Invalid status transition from '{$application->status}' to '{$validated['status']}'.",
                ], 422);
            }

            $oldStatus = $application->status;
            $application->status = $validated['status'];
            $application->logChange($user->id, 'status', $oldStatus, $validated['status']);

            // Notify student of status change
            Notification::notify($application->student_id, 'Status Changed', "Application status changed to {$validated['status']}.", 'application_status');
        }

        // Update other fields
        foreach (['application_type', 'scholarship_type', 'university_id', 'major', 'intake_term', 'notes'] as $field) {
            if (array_key_exists($field, $validated)) {
                $application->{$field} = $validated[$field];
            }
        }

        $application->save();

        return response()->json([
            'message' => 'Application updated.',
            'application' => $application->fresh()->load(['student:id,name,email', 'mentor:id,name,email', 'university:id,name']),
        ]);
    }

    /**
     * Admin: reassign application to different mentor
     */
    public function reassign(Request $request, Application $application): JsonResponse
    {
        $validated = $request->validate([
            'new_mentor_id' => ['required', 'exists:users,id'],
            'notes' => ['sometimes', 'string', 'max:500'],
        ]);

        $oldMentorId = $application->mentor_id;
        $application->update([
            'mentor_id' => $validated['new_mentor_id'],
            'status' => $application->status === Application::STATUS_DRAFT
                ? Application::STATUS_COLLECTING_DOCS
                : $application->status,
        ]);

        $application->logChange(
            $request->user()->id,
            'mentor_id',
            (string) $oldMentorId,
            (string) $validated['new_mentor_id'],
            $validated['notes'] ?? 'Admin reassignment'
        );

        // Notify new mentor
        Notification::notify($validated['new_mentor_id'], 'Application Reassigned', 'An application has been reassigned to you.', 'application_status');

        return response()->json([
            'message' => 'Application reassigned.',
            'application' => $application->fresh()->load(['student:id,name,email', 'mentor:id,name,email']),
        ]);
    }
}
