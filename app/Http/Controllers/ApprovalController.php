<?php

namespace App\Http\Controllers;

use App\Models\Application;
use App\Models\Approval;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ApprovalController extends Controller
{
    // ─────────────────────────────────────────────────────────────
    // Helper: fire notifications to a list of user IDs
    // ─────────────────────────────────────────────────────────────
    private function notifyUsers(array $userIds, string $title, string $body, string $type = 'application_status'): void
    {
        foreach (array_unique(array_filter($userIds)) as $uid) {
            Notification::notify($uid, $title, $body, $type);
        }
    }

    // ─────────────────────────────────────────────────────────────
    // Helper: collect all user IDs with a given role
    // ─────────────────────────────────────────────────────────────
    private function usersWithRole(string $role): array
    {
        return User::where('role', $role)->pluck('id')->all();
    }

    // ─────────────────────────────────────────────────────────────
    // Helper: assert application is in the expected status, or return 422
    // ─────────────────────────────────────────────────────────────
    private function requireStatus(Application $application, string $expected): ?JsonResponse
    {
        if ($application->status !== $expected) {
            return response()->json([
                'message' => "This action requires status '{$expected}', but application is '{$application->status}'.",
                'current_status' => $application->status,
            ], 422);
        }

        return null;
    }

    // ─────────────────────────────────────────────────────────────
    // Helper: enforce a state-machine transition, return 422 if invalid
    // ─────────────────────────────────────────────────────────────
    private function transitionOrFail(Application $application, string $newStatus, int $actorId, string $historyNotes): ?JsonResponse
    {
        if (!$application->canTransitionTo($newStatus)) {
            return response()->json([
                'message' => "Cannot transition from '{$application->status}' to '{$newStatus}'.",
                'current_status' => $application->status,
                'allowed' => Application::ALLOWED_TRANSITIONS[$application->status] ?? [],
            ], 422);
        }

        $old = $application->status;
        $application->update(['status' => $newStatus]);
        $application->logChange($actorId, 'status', $old, $newStatus, $historyNotes);

        return null; // no error
    }

    // ─────────────────────────────────────────────────────────────
    // POST /applications/{application}/submit-review
    // Role: admin, mentor (own app only)
    // Transitions: ready_for_review → review_step_1
    // ─────────────────────────────────────────────────────────────
    public function submitReview(Request $request, Application $application): JsonResponse
    {
        $user = $request->user();

        // IDOR: mentor can only act on their own application
        if ($user->isMentor() && $application->mentor_id !== $user->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $error = $this->transitionOrFail(
            $application,
            Application::STATUS_REVIEW_STEP_1,
            $user->id,
            $validated['notes'] ?? 'Submitted for Step 1 review'
        );

        if ($error) {
            return $error;
        }

        // Notify all reviewer + director users
        $notifyIds = array_merge(
            $this->usersWithRole(User::ROLE_REVIEWER),
            $this->usersWithRole(User::ROLE_DIRECTOR),
        );
        $this->notifyUsers(
            $notifyIds,
            'Application Ready for Review',
            "Application #{$application->id} has been submitted for Step 1 review.",
            'application_review'
        );

        return response()->json([
            'message' => 'Application submitted for Step 1 review.',
            'application' => $application->fresh(['student:id,name,email', 'mentor:id,name,email']),
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // POST /applications/{application}/approve-step1
    // Role: reviewer, director, admin
    // Transitions: review_step_1 → review_step_2
    // ─────────────────────────────────────────────────────────────
    public function approveStep1(Request $request, Application $application): JsonResponse
    {
        $user = $request->user();

        if ($guard = $this->requireStatus($application, Application::STATUS_REVIEW_STEP_1)) {
            return $guard;
        }

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $error = $this->transitionOrFail(
            $application,
            Application::STATUS_REVIEW_STEP_2,
            $user->id,
            $validated['notes'] ?? 'Step 1 approved'
        );

        if ($error) {
            return $error;
        }

        Approval::create([
            'application_id' => $application->id,
            'actor_id' => $user->id,
            'step' => Approval::STEP_ONE,
            'action' => Approval::ACTION_APPROVED,
            'notes' => $validated['notes'] ?? null,
        ]);

        // Notify mentor + student
        $this->notifyUsers(
            [$application->mentor_id, $application->student_id],
            'Step 1 Approved',
            "Application #{$application->id} passed Step 1 review and is awaiting director approval.",
            'application_status'
        );

        return response()->json([
            'message' => 'Step 1 approved. Application moved to Step 2 review.',
            'application' => $application->fresh(['student:id,name,email', 'mentor:id,name,email']),
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // POST /applications/{application}/reject-step1
    // Role: reviewer, director, admin
    // Transitions: review_step_1 → collecting_docs
    // ─────────────────────────────────────────────────────────────
    public function rejectStep1(Request $request, Application $application): JsonResponse
    {
        $user = $request->user();

        if ($guard = $this->requireStatus($application, Application::STATUS_REVIEW_STEP_1)) {
            return $guard;
        }

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $error = $this->transitionOrFail(
            $application,
            Application::STATUS_COLLECTING_DOCS,
            $user->id,
            $validated['notes'] ?? 'Step 1 rejected — returned to collecting docs'
        );

        if ($error) {
            return $error;
        }

        Approval::create([
            'application_id' => $application->id,
            'actor_id' => $user->id,
            'step' => Approval::STEP_ONE,
            'action' => Approval::ACTION_REJECTED,
            'notes' => $validated['notes'] ?? null,
        ]);

        // Notify mentor
        $this->notifyUsers(
            [$application->mentor_id],
            'Step 1 Rejected',
            "Application #{$application->id} was rejected at Step 1. Please update the documents and resubmit.",
            'application_status'
        );

        return response()->json([
            'message' => 'Step 1 rejected. Application returned to collecting docs.',
            'application' => $application->fresh(['student:id,name,email', 'mentor:id,name,email']),
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // POST /applications/{application}/approve-step2
    // Role: director, admin
    // Transitions: review_step_2 → approved
    // ─────────────────────────────────────────────────────────────
    public function approveStep2(Request $request, Application $application): JsonResponse
    {
        $user = $request->user();

        if ($guard = $this->requireStatus($application, Application::STATUS_REVIEW_STEP_2)) {
            return $guard;
        }

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $error = $this->transitionOrFail(
            $application,
            Application::STATUS_APPROVED,
            $user->id,
            $validated['notes'] ?? 'Step 2 approved'
        );

        if ($error) {
            return $error;
        }

        Approval::create([
            'application_id' => $application->id,
            'actor_id' => $user->id,
            'step' => Approval::STEP_TWO,
            'action' => Approval::ACTION_APPROVED,
            'notes' => $validated['notes'] ?? null,
        ]);

        // Notify mentor + student
        $this->notifyUsers(
            [$application->mentor_id, $application->student_id],
            'Application Approved!',
            "Application #{$application->id} has been fully approved and is ready for submission to the university.",
            'application_status'
        );

        return response()->json([
            'message' => 'Step 2 approved. Application is now fully approved.',
            'application' => $application->fresh(['student:id,name,email', 'mentor:id,name,email']),
        ]);
    }

    // ─────────────────────────────────────────────────────────────
    // POST /applications/{application}/reject-step2
    // Role: director, admin
    // Transitions: review_step_2 → collecting_docs
    // ─────────────────────────────────────────────────────────────
    public function rejectStep2(Request $request, Application $application): JsonResponse
    {
        $user = $request->user();

        if ($guard = $this->requireStatus($application, Application::STATUS_REVIEW_STEP_2)) {
            return $guard;
        }

        $validated = $request->validate([
            'notes' => ['nullable', 'string', 'max:2000'],
        ]);

        $error = $this->transitionOrFail(
            $application,
            Application::STATUS_COLLECTING_DOCS,
            $user->id,
            $validated['notes'] ?? 'Step 2 rejected — returned to collecting docs'
        );

        if ($error) {
            return $error;
        }

        Approval::create([
            'application_id' => $application->id,
            'actor_id' => $user->id,
            'step' => Approval::STEP_TWO,
            'action' => Approval::ACTION_REJECTED,
            'notes' => $validated['notes'] ?? null,
        ]);

        // Notify mentor
        $this->notifyUsers(
            [$application->mentor_id],
            'Step 2 Rejected',
            "Application #{$application->id} was rejected at Step 2. Please update and resubmit.",
            'application_status'
        );

        return response()->json([
            'message' => 'Step 2 rejected. Application returned to collecting docs.',
            'application' => $application->fresh(['student:id,name,email', 'mentor:id,name,email']),
        ]);
    }
}
