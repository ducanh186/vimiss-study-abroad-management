<?php

namespace App\Http\Controllers;

use App\Models\MentorInquiry;
use App\Models\MentorProfile;
use App\Models\MentorStudentAssignment;
use App\Models\Notification;
use App\Models\User;
use App\Services\AssignMentorService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MentorController extends Controller
{
    /**
     * List mentors (directory) — available to students, admin, director
     */
    public function index(Request $request): JsonResponse
    {
        $query = MentorProfile::with('user')
            ->where('is_active', true);

        if ($specialty = $request->query('specialty')) {
            $query->where('specialty', $specialty);
        }

        if ($search = $request->query('search')) {
            $query->whereHas('user', function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        $mentors = $query->orderBy('staff_code')->paginate($request->query('per_page', 15));

        // Append computed fields
        $mentors->getCollection()->transform(function ($profile) {
            $profile->current_students = $profile->currentStudentCount();
            $profile->available_slots = $profile->availableSlots();
            return $profile;
        });

        return response()->json($mentors);
    }

    /**
     * Show single mentor profile
     */
    public function show(int $mentorUserId): JsonResponse
    {
        $profile = MentorProfile::with('user')->where('user_id', $mentorUserId)->firstOrFail();
        $profile->current_students = $profile->currentStudentCount();
        $profile->available_slots = $profile->availableSlots();

        return response()->json(['mentor' => $profile]);
    }

    /**
     * Admin: create/update mentor profile
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => ['required', 'exists:users,id'],
            'specialty' => ['sometimes', 'in:CSC,CIS,self-funded,general'],
            'capacity_max' => ['sometimes', 'integer', 'min:1', 'max:20'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ]);

        $user = User::findOrFail($validated['user_id']);
        if (!$user->isMentor()) {
            return response()->json(['message' => 'User is not a mentor.'], 422);
        }

        $existing = MentorProfile::where('user_id', $validated['user_id'])->first();
        if ($existing) {
            return response()->json(['message' => 'Mentor profile already exists.'], 409);
        }

        $validated['staff_code'] = MentorProfile::generateStaffCode();
        $validated['is_active'] = true;

        $profile = MentorProfile::create($validated);

        return response()->json([
            'message' => 'Mentor profile created.',
            'mentor' => $profile->load('user'),
        ], 201);
    }

    /**
     * Admin: update mentor profile
     */
    public function update(Request $request, int $mentorUserId): JsonResponse
    {
        $profile = MentorProfile::where('user_id', $mentorUserId)->firstOrFail();

        $validated = $request->validate([
            'specialty' => ['sometimes', 'in:CSC,CIS,self-funded,general'],
            'capacity_max' => ['sometimes', 'integer', 'min:1', 'max:20'],
            'bio' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ]);

        $profile->update($validated);

        return response()->json([
            'message' => 'Mentor profile updated.',
            'mentor' => $profile->fresh()->load('user'),
        ]);
    }

    /**
     * Admin: disable mentor
     */
    public function disable(AssignMentorService $service, int $mentorUserId): JsonResponse
    {
        $result = $service->disableMentor($mentorUserId);

        return response()->json([
            'message' => 'Mentor disabled. Students and applications marked for reassignment.',
            'affected_students' => $result['affected_students'],
            'affected_applications' => $result['affected_applications'],
        ]);
    }

    /**
     * Admin: enable mentor
     */
    public function enable(AssignMentorService $service, int $mentorUserId): JsonResponse
    {
        $service->enableMentor($mentorUserId);

        return response()->json([
            'message' => 'Mentor re-enabled.',
        ]);
    }

    /**
     * Admin: all mentors (including disabled) with load info
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = MentorProfile::with('user');

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        $mentors = $query->orderBy('staff_code')->paginate($request->query('per_page', 15));

        $mentors->getCollection()->transform(function ($profile) {
            $profile->current_students = $profile->currentStudentCount();
            $profile->available_slots = $profile->availableSlots();
            return $profile;
        });

        return response()->json($mentors);
    }

    /**
     * Mentor: my students list
     */
    public function myStudents(Request $request): JsonResponse
    {
        $user = $request->user();

        $assignments = MentorStudentAssignment::with('student.studentProfile')
            ->where('mentor_id', $user->id)
            ->active()
            ->orderByDesc('assigned_at')
            ->get();

        return response()->json([
            'students' => $assignments,
        ]);
    }

    /**
     * Mentor: list inquiries from students
     */
    public function myInquiries(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = MentorInquiry::with('student')
            ->where('mentor_id', $user->id)
            ->orderByDesc('created_at');

        if ($request->query('unanswered')) {
            $query->unanswered();
        }

        return response()->json([
            'inquiries' => $query->get(),
        ]);
    }

    /**
     * Mentor: answer a student's inquiry
     */
    public function answerInquiry(Request $request, int $inquiryId): JsonResponse
    {
        $request->validate([
            'answer' => ['required', 'string', 'max:2000'],
        ]);

        $user = $request->user();
        $inquiry = MentorInquiry::where('id', $inquiryId)
            ->where('mentor_id', $user->id)
            ->firstOrFail();

        if ($inquiry->answered_at) {
            return response()->json(['message' => 'This inquiry has already been answered.'], 422);
        }

        $inquiry->update([
            'answer' => $request->answer,
            'answered_at' => now(),
        ]);

        Notification::notify($inquiry->student_id, 'Mentor Answered Your Question', "Mentor {$user->name} has replied to your inquiry.", 'mentor_inquiry');

        return response()->json([
            'message' => 'Inquiry answered.',
            'inquiry' => $inquiry->fresh()->load('student'),
        ]);
    }

    /**
     * Director: mentor load view (mentor → num students)
     */
    public function mentorLoad(): JsonResponse
    {
        $mentors = MentorProfile::with('user')
            ->orderBy('staff_code')
            ->get()
            ->map(function ($profile) {
                return [
                    'mentor_id' => $profile->user_id,
                    'name' => $profile->user->name,
                    'staff_code' => $profile->staff_code,
                    'specialty' => $profile->specialty,
                    'capacity_max' => $profile->capacity_max,
                    'current_students' => $profile->currentStudentCount(),
                    'available_slots' => $profile->availableSlots(),
                    'is_active' => $profile->is_active,
                ];
            });

        return response()->json(['mentors' => $mentors]);
    }
}
