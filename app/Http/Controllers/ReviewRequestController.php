<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Notification;
use App\Models\ReviewRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ReviewRequestController extends Controller
{
    /**
     * List review requests (admin/director see all, mentor sees own submissions)
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = ReviewRequest::with([
            'application.student:id,name,email',
            'application.mentor:id,name,email',
            'submitter:id,name',
            'reviewer:id,name',
        ]);

        if ($user->isMentor()) {
            $query->where('submitted_by', $user->id);
        }

        if ($status = $request->query('status')) {
            $query->where('status', $status);
        }

        $requests = $query->orderByDesc('created_at')
            ->paginate($request->query('per_page', 15));

        return response()->json($requests);
    }

    /**
     * Mentor: submit a review request
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'application_id' => ['required', 'exists:applications,id'],
            'type' => ['required', 'in:document_review,application_review,scholarship_approval'],
            'submit_notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $application = Application::findOrFail($validated['application_id']);

        // Mentor can only submit for own applications
        if ($user->isMentor() && $application->mentor_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $reviewRequest = ReviewRequest::create([
            'application_id' => $validated['application_id'],
            'submitted_by' => $user->id,
            'type' => $validated['type'],
            'status' => 'pending',
            'submit_notes' => $validated['submit_notes'] ?? null,
        ]);

        // Notify admins/directors
        $managers = \App\Models\User::whereIn('role', ['admin', 'director'])->get();
        foreach ($managers as $manager) {
            Notification::notify($manager->id, 'New Review Request', "New {$validated['type']} review request submitted.", 'review_result');
        }

        return response()->json([
            'message' => 'Review request submitted.',
            'review_request' => $reviewRequest,
        ], 201);
    }

    /**
     * Admin/Director: approve or reject
     */
    public function review(Request $request, ReviewRequest $reviewRequest): JsonResponse
    {
        $validated = $request->validate([
            'status' => ['required', 'in:approved,rejected'],
            'review_notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $reviewRequest->update([
            'status' => $validated['status'],
            'review_notes' => $validated['review_notes'] ?? null,
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
        ]);

        // Notify submitter
        Notification::notify($reviewRequest->submitted_by, 'Review Result', "Your review request has been {$validated['status']}.", 'review_result');

        return response()->json([
            'message' => "Review request {$validated['status']}.",
            'review_request' => $reviewRequest->fresh()->load(['submitter:id,name', 'reviewer:id,name']),
        ]);
    }
}
