<?php

namespace Tests\Feature;

use App\Models\MentorInquiry;
use App\Models\MentorProfile;
use App\Models\MentorStudentAssignment;
use App\Models\StudentProfile;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Flow S4 — Choose mentor / Random mentor
 *
 * Covers:
 *  1. Student asks mentor a question before choosing (inquiry)
 *  2. Mentor answers the inquiry
 *  3. Student chooses a specific mentor
 *  4. Student gets random mentor
 *  5. "My mentor" returns the assigned mentor
 */
class MentorSelectionFlowTest extends TestCase
{
    use RefreshDatabase;

    private User $student;
    private User $student2;
    private User $mentor1;
    private User $mentor2;

    protected function setUp(): void
    {
        parent::setUp();

        // Create mentor users
        $this->mentor1 = User::factory()->mentor()->create(['name' => 'Mentor Alpha']);
        $this->mentor2 = User::factory()->mentor()->create(['name' => 'Mentor Beta']);

        // Create mentor profiles
        MentorProfile::create([
            'user_id' => $this->mentor1->id,
            'staff_code' => 'M0001',
            'specialty' => 'CSC',
            'capacity_max' => 5,
            'bio' => 'Expert in CSC scholarships',
            'is_active' => true,
        ]);
        MentorProfile::create([
            'user_id' => $this->mentor2->id,
            'staff_code' => 'M0002',
            'specialty' => 'CIS',
            'capacity_max' => 5,
            'bio' => 'Expert in CIS scholarships',
            'is_active' => true,
        ]);

        // Create student users
        $this->student = User::factory()->student()->create(['name' => 'Student A']);
        $this->student2 = User::factory()->student()->create(['name' => 'Student B']);

        // Create student profiles
        StudentProfile::create([
            'user_id' => $this->student->id,
            'desired_scholarship_type' => 'CSC',
        ]);
        StudentProfile::create([
            'user_id' => $this->student2->id,
            'desired_scholarship_type' => 'CIS',
        ]);
    }

    // ---------------------------------------------------------------
    // S4.0 — Mentor directory visible to student
    // ---------------------------------------------------------------

    public function test_student_can_browse_mentor_directory(): void
    {
        $response = $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/mentors/directory');

        $response->assertOk()
            ->assertJsonPath('data.0.is_active', true);
    }

    public function test_student_can_view_single_mentor_profile(): void
    {
        $response = $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/mentors/directory/{$this->mentor1->id}");

        $response->assertOk()
            ->assertJsonPath('mentor.user_id', $this->mentor1->id);
    }

    // ---------------------------------------------------------------
    // S4.1 — Student asks mentor a question (inquiry)
    // ---------------------------------------------------------------

    public function test_student_can_ask_mentor_a_question(): void
    {
        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/ask-mentor', [
                'mentor_id' => $this->mentor1->id,
                'question' => 'What preparation do I need for CSC scholarship to Beijing University?',
            ]);

        $response->assertCreated()
            ->assertJsonPath('message', 'Question sent to mentor.')
            ->assertJsonPath('inquiry.question', 'What preparation do I need for CSC scholarship to Beijing University?')
            ->assertJsonPath('inquiry.mentor.id', $this->mentor1->id);

        $this->assertDatabaseHas('mentor_inquiries', [
            'student_id' => $this->student->id,
            'mentor_id' => $this->mentor1->id,
            'answer' => null,
        ]);
    }

    public function test_student_can_ask_multiple_mentors(): void
    {
        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/ask-mentor', [
                'mentor_id' => $this->mentor1->id,
                'question' => 'Question for mentor 1',
            ])->assertCreated();

        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/ask-mentor', [
                'mentor_id' => $this->mentor2->id,
                'question' => 'Question for mentor 2',
            ])->assertCreated();

        $this->assertDatabaseCount('mentor_inquiries', 2);
    }

    public function test_student_cannot_ask_non_mentor_user(): void
    {
        $nonMentor = User::factory()->admin()->create();

        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/ask-mentor', [
                'mentor_id' => $nonMentor->id,
                'question' => 'Are you a mentor?',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Target user is not a mentor.');
    }

    public function test_student_limited_to_5_unanswered_questions_per_mentor(): void
    {
        // Create 5 unanswered inquiries
        for ($i = 1; $i <= 5; $i++) {
            MentorInquiry::create([
                'student_id' => $this->student->id,
                'mentor_id' => $this->mentor1->id,
                'question' => "Question #{$i}",
            ]);
        }

        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/ask-mentor', [
                'mentor_id' => $this->mentor1->id,
                'question' => 'One more question?',
            ]);

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'You have too many unanswered questions to this mentor. Please wait for replies.']);
    }

    public function test_question_validation_required_fields(): void
    {
        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/ask-mentor', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['mentor_id', 'question']);
    }

    // ---------------------------------------------------------------
    // S4.2 — Mentor views and answers inquiries
    // ---------------------------------------------------------------

    public function test_mentor_can_view_inquiries(): void
    {
        MentorInquiry::create([
            'student_id' => $this->student->id,
            'mentor_id' => $this->mentor1->id,
            'question' => 'What about HSK requirements?',
        ]);

        $response = $this->actingAs($this->mentor1, 'sanctum')
            ->getJson('/api/mentor/inquiries');

        $response->assertOk()
            ->assertJsonCount(1, 'inquiries')
            ->assertJsonPath('inquiries.0.question', 'What about HSK requirements?');
    }

    public function test_mentor_can_filter_unanswered_inquiries(): void
    {
        MentorInquiry::create([
            'student_id' => $this->student->id,
            'mentor_id' => $this->mentor1->id,
            'question' => 'Unanswered question',
        ]);
        MentorInquiry::create([
            'student_id' => $this->student2->id,
            'mentor_id' => $this->mentor1->id,
            'question' => 'Answered question',
            'answer' => 'Here is the answer.',
            'answered_at' => now(),
        ]);

        $response = $this->actingAs($this->mentor1, 'sanctum')
            ->getJson('/api/mentor/inquiries?unanswered=1');

        $response->assertOk()
            ->assertJsonCount(1, 'inquiries')
            ->assertJsonPath('inquiries.0.question', 'Unanswered question');
    }

    public function test_mentor_can_answer_inquiry(): void
    {
        $inquiry = MentorInquiry::create([
            'student_id' => $this->student->id,
            'mentor_id' => $this->mentor1->id,
            'question' => 'Do I need HSK5 for CSC Beijing?',
        ]);

        $response = $this->actingAs($this->mentor1, 'sanctum')
            ->postJson("/api/mentor/inquiries/{$inquiry->id}/answer", [
                'answer' => 'HSK4 is the minimum requirement, but HSK5 is recommended for competitiveness.',
            ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Inquiry answered.')
            ->assertJsonPath('inquiry.answer', 'HSK4 is the minimum requirement, but HSK5 is recommended for competitiveness.');

        $inquiry->refresh();
        $this->assertNotNull($inquiry->answered_at);
    }

    public function test_mentor_cannot_answer_other_mentors_inquiry(): void
    {
        $inquiry = MentorInquiry::create([
            'student_id' => $this->student->id,
            'mentor_id' => $this->mentor1->id,
            'question' => 'Question for mentor 1',
        ]);

        $response = $this->actingAs($this->mentor2, 'sanctum')
            ->postJson("/api/mentor/inquiries/{$inquiry->id}/answer", [
                'answer' => 'Trying to answer someone else\'s inquiry',
            ]);

        $response->assertNotFound();
    }

    public function test_mentor_cannot_answer_already_answered_inquiry(): void
    {
        $inquiry = MentorInquiry::create([
            'student_id' => $this->student->id,
            'mentor_id' => $this->mentor1->id,
            'question' => 'Already answered',
            'answer' => 'First answer.',
            'answered_at' => now(),
        ]);

        $response = $this->actingAs($this->mentor1, 'sanctum')
            ->postJson("/api/mentor/inquiries/{$inquiry->id}/answer", [
                'answer' => 'Trying to change the answer',
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'This inquiry has already been answered.');
    }

    // ---------------------------------------------------------------
    // S4.3 — Student views inquiry answers then chooses mentor
    // ---------------------------------------------------------------

    public function test_student_can_view_own_inquiries(): void
    {
        MentorInquiry::create([
            'student_id' => $this->student->id,
            'mentor_id' => $this->mentor1->id,
            'question' => 'My question',
            'answer' => 'The answer',
            'answered_at' => now(),
        ]);

        $response = $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/student/my-inquiries');

        $response->assertOk()
            ->assertJsonCount(1, 'inquiries')
            ->assertJsonPath('inquiries.0.answer', 'The answer');
    }

    public function test_student_can_filter_inquiries_by_mentor(): void
    {
        MentorInquiry::create([
            'student_id' => $this->student->id,
            'mentor_id' => $this->mentor1->id,
            'question' => 'For mentor 1',
        ]);
        MentorInquiry::create([
            'student_id' => $this->student->id,
            'mentor_id' => $this->mentor2->id,
            'question' => 'For mentor 2',
        ]);

        $response = $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/student/my-inquiries?mentor_id={$this->mentor1->id}");

        $response->assertOk()
            ->assertJsonCount(1, 'inquiries')
            ->assertJsonPath('inquiries.0.question', 'For mentor 1');
    }

    // ---------------------------------------------------------------
    // S4.4 — Student chooses specific mentor (after inquiry)
    // ---------------------------------------------------------------

    public function test_student_choose_mentor_after_inquiry(): void
    {
        // Step 1: Student asks question
        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/ask-mentor', [
                'mentor_id' => $this->mentor1->id,
                'question' => 'What is your experience with CSC scholarships?',
            ])->assertCreated();

        // Step 2: Mentor answers
        $inquiry = MentorInquiry::first();
        $this->actingAs($this->mentor1, 'sanctum')
            ->postJson("/api/mentor/inquiries/{$inquiry->id}/answer", [
                'answer' => 'I have helped 20+ students get CSC scholarships.',
            ])->assertOk();

        // Step 3: Student reviews answer
        $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/student/my-inquiries')
            ->assertOk()
            ->assertJsonPath('inquiries.0.answer', 'I have helped 20+ students get CSC scholarships.');

        // Step 4: Satisfied, student chooses this mentor
        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/choose-mentor', [
                'mentor_id' => $this->mentor1->id,
            ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Mentor assigned successfully.');

        // Step 5: Verify "my mentor"
        $response = $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/student/my-mentor');

        $response->assertOk()
            ->assertJsonPath('mentor.id', $this->mentor1->id)
            ->assertJsonPath('mentor.name', 'Mentor Alpha');
    }

    public function test_student_choose_specific_mentor(): void
    {
        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/choose-mentor', [
                'mentor_id' => $this->mentor1->id,
            ]);

        $response->assertOk()
            ->assertJsonPath('message', 'Mentor assigned successfully.');

        $this->assertDatabaseHas('mentor_student_assignments', [
            'student_id' => $this->student->id,
            'mentor_id' => $this->mentor1->id,
            'assigned_by' => 'student',
        ]);
    }

    public function test_student_cannot_choose_mentor_twice(): void
    {
        // Assign first
        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/choose-mentor', [
                'mentor_id' => $this->mentor1->id,
            ])->assertOk();

        // Try choosing again
        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/choose-mentor', [
                'mentor_id' => $this->mentor2->id,
            ]);

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'Student already has an assigned mentor. Unassign first.']);
    }

    public function test_student_cannot_choose_inactive_mentor(): void
    {
        MentorProfile::where('user_id', $this->mentor1->id)
            ->update(['is_active' => false]);

        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/choose-mentor', [
                'mentor_id' => $this->mentor1->id,
            ]);

        $response->assertStatus(422)
            ->assertJsonFragment(['message' => 'Mentor is not active.']);
    }

    // ---------------------------------------------------------------
    // S4.5 — Student gets random mentor
    // ---------------------------------------------------------------

    public function test_student_random_mentor_assignment(): void
    {
        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/random-mentor');

        $response->assertOk()
            ->assertJsonPath('message', 'Mentor randomly assigned.');

        // Mentor should be assigned
        $assignment = MentorStudentAssignment::where('student_id', $this->student->id)
            ->active()
            ->first();

        $this->assertNotNull($assignment);
        $this->assertContains($assignment->mentor_id, [$this->mentor1->id, $this->mentor2->id]);
    }

    public function test_random_mentor_prefers_specialty_match(): void
    {
        // Student wants CSC, mentor1 is CSC specialist → should match
        // Make mentor2 have no capacity to force selection
        MentorProfile::where('user_id', $this->mentor2->id)
            ->update(['capacity_max' => 0]);

        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/random-mentor');

        $response->assertOk();

        $assignment = MentorStudentAssignment::where('student_id', $this->student->id)
            ->active()
            ->first();

        $this->assertEquals($this->mentor1->id, $assignment->mentor_id);
    }

    public function test_random_mentor_fails_when_no_capacity(): void
    {
        MentorProfile::query()->update(['capacity_max' => 0]);

        $response = $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/random-mentor');

        $response->assertStatus(500)
            ->assertJsonFragment(['message' => 'No available mentors with capacity.']);
    }

    // ---------------------------------------------------------------
    // S4.6 — My mentor endpoint
    // ---------------------------------------------------------------

    public function test_my_mentor_returns_null_when_no_assignment(): void
    {
        $response = $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/student/my-mentor');

        $response->assertOk()
            ->assertJsonPath('mentor', null)
            ->assertJsonPath('message', 'No mentor assigned yet.');
    }

    public function test_my_mentor_returns_correct_mentor_after_assignment(): void
    {
        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/choose-mentor', [
                'mentor_id' => $this->mentor1->id,
            ])->assertOk();

        $response = $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/student/my-mentor');

        $response->assertOk()
            ->assertJsonPath('mentor.id', $this->mentor1->id)
            ->assertJsonPath('mentor.name', 'Mentor Alpha')
            ->assertJsonStructure([
                'mentor' => ['id', 'name', 'email'],
                'mentor_profile' => ['specialty', 'bio'],
                'assignment' => ['assigned_at', 'assigned_by'],
            ]);
    }

    // ---------------------------------------------------------------
    // S4.7 — Notifications generated
    // ---------------------------------------------------------------

    public function test_notifications_created_on_mentor_assignment(): void
    {
        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/choose-mentor', [
                'mentor_id' => $this->mentor1->id,
            ])->assertOk();

        // Mentor should receive notification
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->mentor1->id,
            'type' => 'mentor_assigned',
        ]);

        // Student should receive notification
        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->student->id,
            'type' => 'mentor_assigned',
        ]);
    }

    public function test_notification_created_on_inquiry(): void
    {
        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/ask-mentor', [
                'mentor_id' => $this->mentor1->id,
                'question' => 'A question?',
            ])->assertCreated();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->mentor1->id,
            'type' => 'mentor_inquiry',
        ]);
    }

    public function test_notification_created_on_inquiry_answer(): void
    {
        $inquiry = MentorInquiry::create([
            'student_id' => $this->student->id,
            'mentor_id' => $this->mentor1->id,
            'question' => 'Question?',
        ]);

        $this->actingAs($this->mentor1, 'sanctum')
            ->postJson("/api/mentor/inquiries/{$inquiry->id}/answer", [
                'answer' => 'Answer.',
            ])->assertOk();

        $this->assertDatabaseHas('notifications', [
            'user_id' => $this->student->id,
            'type' => 'mentor_inquiry',
        ]);
    }

    // ---------------------------------------------------------------
    // S4.8 — Full E2E flow: browse → ask → read answer → choose → verify
    // ---------------------------------------------------------------

    public function test_full_flow_browse_ask_answer_choose_verify(): void
    {
        // 1. Student browses mentor list
        $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/mentors/directory')
            ->assertOk();

        // 2. Student views mentor1 profile
        $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/mentors/directory/{$this->mentor1->id}")
            ->assertOk()
            ->assertJsonPath('mentor.specialty', 'CSC');

        // 3. Student asks mentor1 a question
        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/ask-mentor', [
                'mentor_id' => $this->mentor1->id,
                'question' => 'How many students have you helped get CSC scholarships?',
            ])->assertCreated();

        // 4. Student asks mentor1 a second question
        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/ask-mentor', [
                'mentor_id' => $this->mentor1->id,
                'question' => 'What documents should I prepare first?',
            ])->assertCreated();

        // 5. Mentor1 answers both questions
        $inquiries = MentorInquiry::where('mentor_id', $this->mentor1->id)
            ->orderBy('id')
            ->get();

        $this->actingAs($this->mentor1, 'sanctum')
            ->postJson("/api/mentor/inquiries/{$inquiries[0]->id}/answer", [
                'answer' => 'I have helped over 30 students with CSC applications.',
            ])->assertOk();

        $this->actingAs($this->mentor1, 'sanctum')
            ->postJson("/api/mentor/inquiries/{$inquiries[1]->id}/answer", [
                'answer' => 'Start with your study plan and recommendation letters.',
            ])->assertOk();

        // 6. Student reads all answers
        $response = $this->actingAs($this->student, 'sanctum')
            ->getJson("/api/student/my-inquiries?mentor_id={$this->mentor1->id}");

        $response->assertOk()
            ->assertJsonCount(2, 'inquiries');

        // Both should have answers
        $inquiriesData = $response->json('inquiries');
        foreach ($inquiriesData as $inq) {
            $this->assertNotNull($inq['answer']);
            $this->assertNotNull($inq['answered_at']);
        }

        // 7. Student is satisfied → choose this mentor
        $this->actingAs($this->student, 'sanctum')
            ->postJson('/api/student/choose-mentor', [
                'mentor_id' => $this->mentor1->id,
            ])->assertOk();

        // 8. Verify "my mentor" is correct
        $response = $this->actingAs($this->student, 'sanctum')
            ->getJson('/api/student/my-mentor');

        $response->assertOk()
            ->assertJsonPath('mentor.id', $this->mentor1->id)
            ->assertJsonPath('mentor.name', 'Mentor Alpha');
    }
}
