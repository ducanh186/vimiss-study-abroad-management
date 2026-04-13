<?php

namespace App\Http\Controllers;

use App\Models\MentorInquiry;
use App\Models\MentorStudentAssignment;
use App\Models\Notification;
use App\Models\StudentProfile;
use App\Models\User;
use App\Services\AssignMentorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StudentProfileController extends Controller
{
    /**
     * Get own student profile (or any for admin)
     */
    public function show(Request $request, ?int $userId = null): JsonResponse
    {
        $targetId = $userId ?? $request->user()->id;

        // IDOR check: student can only view own profile
        if ($request->user()->isStudent() && $targetId !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $user = User::with('studentProfile')->findOrFail($targetId);

        return response()->json([
            'profile' => $user->studentProfile,
            'user' => $user->only(['id', 'name', 'email', 'role']),
        ]);
    }

    /**
     * Update own student profile
     */
    public function update(Request $request): JsonResponse
    {
        $user = $request->user();
        if (!$user->isStudent()) {
            return response()->json(['message' => 'Only students can update student profiles.'], 403);
        }

        $validated = $request->validate([
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'date_of_birth' => ['sometimes', 'nullable', 'date'],
            'passport_status' => ['sometimes', 'in:none,valid,expired,processing'],
            'gpa' => ['sometimes', 'nullable', 'numeric', 'min:0', 'max:4.00'],
            'hsk_level' => ['sometimes', 'nullable', 'in:HSK1,HSK2,HSK3,HSK4,HSK5,HSK6'],
            'hskk_level' => ['sometimes', 'nullable', 'in:beginner,intermediate,advanced'],
            'desired_scholarship_type' => ['sometimes', 'nullable', 'in:CSC,CIS,self-funded'],
            'notes' => ['sometimes', 'nullable', 'string', 'max:2000'],
        ]);

        $profile = StudentProfile::updateOrCreate(
            ['user_id' => $user->id],
            $validated
        );

        return response()->json([
            'message' => 'Student profile updated.',
            'profile' => $profile,
        ]);
    }

    /**
     * Student: choose mentor (manual)
     */
    public function chooseMentor(Request $request, AssignMentorService $service): JsonResponse
    {
        $request->validate([
            'mentor_id' => ['required', 'exists:users,id'],
        ]);

        $user = $request->user();
        if (!$user->isStudent()) {
            return response()->json(['message' => 'Only students can choose mentors.'], 403);
        }

        try {
            $assignment = $service->manualAssign($user->id, $request->mentor_id, 'student');
            return response()->json([
                'message' => 'Mentor assigned successfully.',
                'assignment' => $assignment->load('mentor'),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Student: random mentor
     */
    public function randomMentor(Request $request, AssignMentorService $service): JsonResponse
    {
        $user = $request->user();
        if (!$user->isStudent()) {
            return response()->json(['message' => 'Only students can request random mentor.'], 403);
        }

        try {
            $assignment = $service->randomAssign($user->id, 'student');
            return response()->json([
                'message' => 'Mentor randomly assigned.',
                'assignment' => $assignment->load('mentor'),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        } catch (\RuntimeException $e) {
            return response()->json(['message' => $e->getMessage()], 500);
        }
    }

    /**
     * Student: get my mentor info
     */
    public function myMentor(Request $request): JsonResponse
    {
        $user = $request->user();

        $assignment = MentorStudentAssignment::with('mentor.mentorProfile')
            ->where('student_id', $user->id)
            ->active()
            ->first();

        if (!$assignment) {
            return response()->json([
                'mentor' => null,
                'message' => 'No mentor assigned yet.',
            ]);
        }

        return response()->json([
            'mentor' => $assignment->mentor,
            'mentor_profile' => $assignment->mentor->mentorProfile,
            'assignment' => $assignment,
        ]);
    }

    /**
     * Student: ask a mentor a question before choosing
     */
    public function askMentor(Request $request): JsonResponse
    {
        $request->validate([
            'mentor_id' => ['required', 'exists:users,id'],
            'question' => ['required', 'string', 'max:1000'],
        ]);

        $user = $request->user();
        $mentor = User::findOrFail($request->mentor_id);

        if (!$mentor->isMentor()) {
            return response()->json(['message' => 'Target user is not a mentor.'], 422);
        }

        // Limit: max 5 unanswered questions per student-mentor pair
        $unanswered = MentorInquiry::where('student_id', $user->id)
            ->where('mentor_id', $mentor->id)
            ->unanswered()
            ->count();
        if ($unanswered >= 5) {
            return response()->json(['message' => 'You have too many unanswered questions to this mentor. Please wait for replies.'], 422);
        }

        $inquiry = MentorInquiry::create([
            'student_id' => $user->id,
            'mentor_id' => $mentor->id,
            'question' => $request->question,
        ]);

        Notification::notify($mentor->id, 'New Student Inquiry', "Student {$user->name} asked you a question.", 'mentor_inquiry');

        return response()->json([
            'message' => 'Question sent to mentor.',
            'inquiry' => $inquiry->load('mentor'),
        ], 201);
    }

    /**
     * Student: list my inquiries to mentors
     */
    public function myInquiries(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = MentorInquiry::with('mentor')
            ->where('student_id', $user->id)
            ->orderByDesc('created_at');

        if ($mentorId = $request->query('mentor_id')) {
            $query->where('mentor_id', $mentorId);
        }

        return response()->json([
            'inquiries' => $query->get(),
        ]);
    }

    /**
     * Admin: assign mentor to student
     */
    public function adminAssign(Request $request, AssignMentorService $service): JsonResponse
    {
        $request->validate([
            'student_id' => ['required', 'exists:users,id'],
            'mentor_id' => ['required', 'exists:users,id'],
        ]);

        try {
            $assignment = $service->manualAssign($request->student_id, $request->mentor_id, 'admin');
            return response()->json([
                'message' => 'Mentor assigned by admin.',
                'assignment' => $assignment->load(['student', 'mentor']),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }

    /**
     * Admin: reassign student to different mentor
     */
    public function adminReassign(Request $request, AssignMentorService $service): JsonResponse
    {
        $request->validate([
            'student_id' => ['required', 'exists:users,id'],
            'new_mentor_id' => ['required', 'exists:users,id'],
            'reason' => ['sometimes', 'string', 'max:500'],
        ]);

        try {
            $assignment = $service->reassign(
                $request->student_id,
                $request->new_mentor_id,
                $request->reason ?? 'admin reassignment',
                $request->user()->id
            );
            return response()->json([
                'message' => 'Student reassigned successfully.',
                'assignment' => $assignment->load(['student', 'mentor']),
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
