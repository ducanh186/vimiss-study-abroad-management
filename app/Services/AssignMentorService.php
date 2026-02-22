<?php

namespace App\Services;

use App\Models\Application;
use App\Models\MentorProfile;
use App\Models\MentorStudentAssignment;
use App\Models\Notification;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class AssignMentorService
{
    /**
     * Manual assign: student chooses a specific mentor
     */
    public function manualAssign(int $studentId, int $mentorId, string $assignedBy = 'student'): MentorStudentAssignment
    {
        return DB::transaction(function () use ($studentId, $mentorId, $assignedBy) {
            $student = User::findOrFail($studentId);
            $mentor = User::findOrFail($mentorId);
            $profile = MentorProfile::where('user_id', $mentorId)->firstOrFail();

            // Validations
            if (!$student->isStudent()) {
                throw new \InvalidArgumentException('Target user is not a student.');
            }
            if (!$mentor->isMentor()) {
                throw new \InvalidArgumentException('Target user is not a mentor.');
            }
            if (!$profile->is_active) {
                throw new \InvalidArgumentException('Mentor is not active.');
            }
            if (!$profile->hasCapacity()) {
                throw new \InvalidArgumentException('Mentor has reached maximum student capacity.');
            }

            // Check if student already has an active mentor
            $existing = MentorStudentAssignment::where('student_id', $studentId)
                ->active()
                ->first();
            if ($existing) {
                throw new \InvalidArgumentException('Student already has an assigned mentor. Unassign first.');
            }

            $assignment = MentorStudentAssignment::create([
                'student_id' => $studentId,
                'mentor_id' => $mentorId,
                'assigned_at' => now(),
                'assigned_by' => $assignedBy,
            ]);

            // Notify mentor
            Notification::notify($mentorId, 'New Student Assigned', "Student {$student->name} has been assigned to you.", 'mentor_assigned');

            // Notify student
            Notification::notify($studentId, 'Mentor Assigned', "You have been assigned mentor {$mentor->name}.", 'mentor_assigned');

            return $assignment;
        });
    }

    /**
     * Random assign: system picks best-fit mentor
     * Priority: specialty match → fallback any mentor with slots
     */
    public function randomAssign(int $studentId, string $assignedBy = 'student'): MentorStudentAssignment
    {
        $student = User::findOrFail($studentId);
        if (!$student->isStudent()) {
            throw new \InvalidArgumentException('Target user is not a student.');
        }

        // Check if student already has a mentor
        $existing = MentorStudentAssignment::where('student_id', $studentId)
            ->active()
            ->first();
        if ($existing) {
            throw new \InvalidArgumentException('Student already has an assigned mentor.');
        }

        // Get student's desired scholarship type for specialty matching
        $desiredType = $student->studentProfile?->desired_scholarship_type;

        // Map scholarship type to mentor specialty
        $specialtyMap = [
            'CSC' => 'CSC',
            'CIS' => 'CIS',
            'self-funded' => 'self-funded',
        ];
        $preferredSpecialty = $specialtyMap[$desiredType] ?? null;

        // Find available mentors (active + has capacity)
        $availableMentors = MentorProfile::where('is_active', true)
            ->get()
            ->filter(fn ($profile) => $profile->hasCapacity());

        if ($availableMentors->isEmpty()) {
            throw new \RuntimeException('No available mentors with capacity.');
        }

        // Try specialty match first
        $mentor = null;
        if ($preferredSpecialty) {
            $matched = $availableMentors->where('specialty', $preferredSpecialty);
            if ($matched->isNotEmpty()) {
                // Pick the one with most available slots
                $mentor = $matched->sortByDesc(fn ($p) => $p->availableSlots())->first();
            }
        }

        // Fallback: any mentor with slots (prefer general, then most slots)
        if (!$mentor) {
            $mentor = $availableMentors
                ->sortByDesc(fn ($p) => $p->availableSlots())
                ->first();
        }

        return $this->manualAssign($studentId, $mentor->user_id, $assignedBy);
    }

    /**
     * Unassign a student from their mentor
     */
    public function unassign(int $studentId, string $reason = 'manual', ?int $performedBy = null): void
    {
        $assignment = MentorStudentAssignment::where('student_id', $studentId)
            ->active()
            ->firstOrFail();

        $assignment->update([
            'unassigned_at' => now(),
            'unassign_reason' => $reason,
        ]);
    }

    /**
     * Reassign a student from one mentor to another
     */
    public function reassign(int $studentId, int $newMentorId, string $reason = 'reassignment', ?int $performedBy = null): MentorStudentAssignment
    {
        return DB::transaction(function () use ($studentId, $newMentorId, $reason, $performedBy) {
            // Unassign current
            $this->unassign($studentId, $reason, $performedBy);

            // Assign to new mentor
            return $this->manualAssign($studentId, $newMentorId, 'admin');
        });
    }

    /**
     * Disable a mentor: block actions, mark students as needs reassignment
     */
    public function disableMentor(int $mentorId): array
    {
        return DB::transaction(function () use ($mentorId) {
            $profile = MentorProfile::where('user_id', $mentorId)->firstOrFail();
            $profile->update(['is_active' => false]);

            // Get all active assignments
            $assignments = MentorStudentAssignment::where('mentor_id', $mentorId)
                ->active()
                ->get();

            $affectedStudents = [];
            $affectedApplications = [];

            foreach ($assignments as $assignment) {
                $affectedStudents[] = $assignment->student_id;

                // Notify student
                Notification::notify($assignment->student_id, 'Mentor Disabled', 'Your mentor has been deactivated. An admin will reassign you to a new mentor.', 'mentor_assigned');
            }

            // Set applications to on_hold_needs_mentor
            $applications = Application::where('mentor_id', $mentorId)
                ->whereNotIn('status', [
                    Application::STATUS_ADMITTED,
                    Application::STATUS_REJECTED,
                    Application::STATUS_CANCELLED,
                ])
                ->get();

            foreach ($applications as $app) {
                $oldStatus = $app->status;
                $app->update(['status' => Application::STATUS_DRAFT]);
                $app->logChange($mentorId, 'status', $oldStatus, Application::STATUS_DRAFT, 'Mentor disabled');
                $affectedApplications[] = $app->id;
            }

            // Notify all admins
            $admins = User::where('role', User::ROLE_ADMIN)->get();
            foreach ($admins as $admin) {
                Notification::notify($admin->id, 'Mentor Disabled', "Mentor (ID: {$mentorId}) has been disabled. " . count($affectedStudents) . " students need reassignment.", 'mentor_assigned');
            }

            return [
                'affected_students' => $affectedStudents,
                'affected_applications' => $affectedApplications,
            ];
        });
    }

    /**
     * Re-enable a mentor
     */
    public function enableMentor(int $mentorId): void
    {
        $profile = MentorProfile::where('user_id', $mentorId)->firstOrFail();
        $profile->update(['is_active' => true]);
    }
}
