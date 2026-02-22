<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds:
 *  - mentor_student_assignments (3 active, 1 historical)
 *  - applications (8) covering new 13-state pipeline statuses:
 *      draft, collecting_docs, ready_for_review, review_step_1,
 *      review_step_2, approved, submitted, admitted
 *    Uses new fields: application_type, scholarship_type, university_id, major, intake_term
 *  - scholarship_requests (6)
 */
class ApplicationSeeder extends Seeder
{
    public function run(): void
    {
        $admin    = User::where('email', 'admin@vimiss.vn')->firstOrFail();
        $mentor1  = User::where('email', 'mentor1@vimiss.vn')->firstOrFail();
        $mentor2  = User::where('email', 'mentor2@vimiss.vn')->firstOrFail();
        $student1 = User::where('email', 'student1@vimiss.vn')->firstOrFail();
        $student2 = User::where('email', 'student2@vimiss.vn')->firstOrFail();
        $student3 = User::where('email', 'student3@vimiss.vn')->firstOrFail();

        // University IDs
        $uniBK   = DB::table('universities')->where('name', 'Đại học Bắc Kinh')->value('id');
        $uniTH   = DB::table('universities')->where('name', 'Đại học Thanh Hoa')->value('id');
        $uniZJ   = DB::table('universities')->where('name', 'Đại học Triết Giang')->value('id');
        $uniUstc = DB::table('universities')->where('name', 'Đại học Khoa học và Công nghệ Trung Quốc (USTC)')->value('id');
        $uniFD   = DB::table('universities')->where('name', 'Đại học Phúc Đán')->value('id');

        // ------------------------------------------------------------------
        // Mentor-Student Assignments
        // ------------------------------------------------------------------
        // Historical: student2 was with mentor1, then switched to mentor2
        DB::table('mentor_student_assignments')->updateOrInsert(
            ['student_id' => $student2->id, 'mentor_id' => $mentor1->id],
            [
                'assigned_at'     => now()->subDays(60),
                'assigned_by'     => 'admin',
                'unassigned_at'   => now()->subDays(30),
                'unassign_reason' => 'Chuyển sang mentor chuyên CIS phù hợp hơn',
                'created_at'      => now()->subDays(60),
                'updated_at'      => now()->subDays(30),
            ]
        );

        // Active assignments
        $activeAssignments = [
            [$student1->id, $mentor1->id, 'admin',  55],
            [$student2->id, $mentor2->id, 'admin',  28],
            [$student3->id, $mentor2->id, 'student', 45],
        ];

        foreach ($activeAssignments as [$stuId, $menId, $by, $daysAgo]) {
            DB::table('mentor_student_assignments')->updateOrInsert(
                ['student_id' => $stuId, 'mentor_id' => $menId, 'unassigned_at' => null],
                [
                    'assigned_at' => now()->subDays($daysAgo),
                    'assigned_by' => $by,
                    'unassigned_at' => null,
                    'unassign_reason' => null,
                    'created_at'  => now()->subDays($daysAgo),
                    'updated_at'  => now()->subDays($daysAgo),
                ]
            );
        }

        // ------------------------------------------------------------------
        // Applications (8) — using new 13-state pipeline + new fields
        // ------------------------------------------------------------------
        DB::table('applications')->whereIn('student_id', [
            $student1->id, $student2->id, $student3->id,
        ])->delete();

        $applications = [
            // 1. DRAFT — student1 / mentor1 — CSC Bắc Kinh master
            [
                'student_id'       => $student1->id,
                'mentor_id'        => $mentor1->id,
                'created_by'       => $mentor1->id,
                'status'           => 'draft',
                'application_type' => 'master',
                'scholarship_type' => 'CSC',
                'university_id'    => $uniBK,
                'major'            => 'Khoa học Máy tính',
                'intake_term'      => '2026-Fall',
                'notes'            => 'Hồ sơ CSC Bắc Kinh mới khởi tạo. Cần bổ sung thông tin cơ bản.',
                'created_at'       => now()->subDays(40),
                'updated_at'       => now()->subDays(38),
            ],
            // 2. COLLECTING_DOCS — student1 / mentor1 — CSC Bắc Kinh engineer
            [
                'student_id'       => $student1->id,
                'mentor_id'        => $mentor1->id,
                'created_by'       => $mentor1->id,
                'status'           => 'collecting_docs',
                'application_type' => 'engineer',
                'scholarship_type' => 'CSC',
                'university_id'    => $uniBK,
                'major'            => 'Kỹ thuật Điện tử',
                'intake_term'      => '2026-Fall',
                'notes'            => 'Đang chờ sinh viên cung cấp: hộ chiếu (sắp hết hạn), bảng điểm công chứng.',
                'created_at'       => now()->subDays(35),
                'updated_at'       => now()->subDays(10),
            ],
            // 3. READY_FOR_REVIEW — student2 / mentor2 — CIS Triết Giang master
            [
                'student_id'       => $student2->id,
                'mentor_id'        => $mentor2->id,
                'created_by'       => $mentor2->id,
                'status'           => 'ready_for_review',
                'application_type' => 'master',
                'scholarship_type' => 'CIS',
                'university_id'    => $uniZJ,
                'major'            => 'Quản trị Kinh doanh',
                'intake_term'      => '2026-Fall',
                'notes'            => 'Hồ sơ CIS Triết Giang đã đủ, đang chờ gửi review.',
                'created_at'       => now()->subDays(25),
                'updated_at'       => now()->subDays(5),
            ],
            // 4. REVIEW_STEP_1 — student2 / mentor1 — CIS Bắc Kinh language
            [
                'student_id'       => $student2->id,
                'mentor_id'        => $mentor1->id,
                'created_by'       => $mentor1->id,
                'status'           => 'review_step_1',
                'application_type' => 'language',
                'scholarship_type' => 'CIS',
                'university_id'    => $uniBK,
                'major'            => 'Tiếng Trung',
                'intake_term'      => '2026-Spring',
                'notes'            => 'Đơn xin học ngôn ngữ CIS Bắc Kinh. Đang chờ Reviewer duyệt Step 1.',
                'created_at'       => now()->subDays(50),
                'updated_at'       => now()->subDays(3),
            ],
            // 5. REVIEW_STEP_2 — student3 / mentor2 — province Phúc Đán bachelor
            [
                'student_id'       => $student3->id,
                'mentor_id'        => $mentor2->id,
                'created_by'       => $mentor2->id,
                'status'           => 'review_step_2',
                'application_type' => 'bachelor',
                'scholarship_type' => 'province',
                'university_id'    => $uniFD,
                'major'            => 'Y khoa',
                'intake_term'      => '2026-Fall',
                'notes'            => 'Đã qua Step 1, đang chờ Director duyệt Step 2.',
                'created_at'       => now()->subDays(45),
                'updated_at'       => now()->subDays(2),
            ],
            // 6. SUBMITTED — student3 / mentor2 — self_funded USTC master
            [
                'student_id'       => $student3->id,
                'mentor_id'        => $mentor2->id,
                'created_by'       => $mentor2->id,
                'status'           => 'submitted',
                'application_type' => 'master',
                'scholarship_type' => 'self_funded',
                'university_id'    => $uniUstc,
                'major'            => 'Khoa học Vật liệu',
                'intake_term'      => '2026-Fall',
                'notes'            => 'Hồ sơ SELF USTC đã được nộp chính thức ngày 14/02/2026. Chờ phản hồi.',
                'created_at'       => now()->subDays(90),
                'updated_at'       => now()->subDays(5),
            ],
            // 7. ADMITTED — student1 / mentor1 — CSC Thanh Hoa master (success case)
            [
                'student_id'       => $student1->id,
                'mentor_id'        => $mentor1->id,
                'created_by'       => $mentor1->id,
                'status'           => 'admitted',
                'application_type' => 'master',
                'scholarship_type' => 'CSC',
                'university_id'    => $uniTH,
                'major'            => 'Kỹ thuật Phần mềm',
                'intake_term'      => '2025-Fall',
                'notes'            => 'Chúc mừng! Sinh viên đã được nhận vào Thanh Hoa.',
                'created_at'       => now()->subDays(180),
                'updated_at'       => now()->subDays(30),
            ],
            // 8. CANCELLED — student3 / admin — CSC Thanh Hoa (student cancelled)
            [
                'student_id'       => $student3->id,
                'mentor_id'        => $admin->id,
                'created_by'       => $admin->id,
                'status'           => 'cancelled',
                'application_type' => 'master',
                'scholarship_type' => 'CSC',
                'university_id'    => $uniTH,
                'major'            => 'Toán học',
                'intake_term'      => '2026-Fall',
                'notes'            => 'Sinh viên hủy hồ sơ do thay đổi kế hoạch.',
                'created_at'       => now()->subDays(60),
                'updated_at'       => now()->subDays(15),
            ],
        ];

        foreach ($applications as $app) {
            DB::table('applications')->insert($app);
        }

        // ------------------------------------------------------------------
        // Scholarship Requests (link applications to scholarships)
        // ------------------------------------------------------------------
        $apps = DB::table('applications')
            ->whereIn('student_id', [$student1->id, $student2->id, $student3->id])
            ->orderBy('id')
            ->get();

        if ($apps->count() >= 8) {
            $app1 = $apps[0]; // draft        student1/mentor1  CSC BK
            $app2 = $apps[1]; // collecting   student1/mentor1  CSC BK
            $app3 = $apps[2]; // ready_review student2/mentor2  CIS ZJ
            $app4 = $apps[3]; // review_step1 student2/mentor1  CIS BK
            $app5 = $apps[4]; // review_step2 student3/mentor2  province FD
            $app6 = $apps[5]; // submitted    student3/mentor2  self USTC
            $app7 = $apps[6]; // admitted     student1/mentor1  CSC TH
            $app8 = $apps[7]; // cancelled    student3/admin    CSC TH

            $cscBK     = DB::table('scholarships')->where('type', 'CSC')->where('university_id', $uniBK)->value('id');
            $cisBK     = DB::table('scholarships')->where('type', 'CIS')->where('university_id', $uniBK)->value('id');
            $cisZJ     = DB::table('scholarships')->where('type', 'CIS')->where('university_id', $uniZJ)->value('id');
            $selfUstc  = DB::table('scholarships')->where('type', 'self-funded')->where('university_id', $uniUstc)->value('id');
            $cscTH     = DB::table('scholarships')->where('type', 'CSC')->where('university_id', $uniTH)->value('id');

            $scholarshipRequests = [
                ['application_id' => $app1->id, 'scholarship_id' => $cscBK,    'requested_by' => $mentor1->id,  'status' => 'pending',  'notes' => 'Đang chuẩn bị hồ sơ CSC Bắc Kinh.'],
                ['application_id' => $app2->id, 'scholarship_id' => $cscBK,    'requested_by' => $mentor1->id,  'status' => 'pending',  'notes' => 'Chờ tài liệu bổ sung từ sinh viên.'],
                ['application_id' => $app3->id, 'scholarship_id' => $cisZJ,    'requested_by' => $mentor2->id,  'status' => 'pending',  'notes' => 'Hồ sơ đã sẵn sàng, chờ review.'],
                ['application_id' => $app4->id, 'scholarship_id' => $cisBK,    'requested_by' => $mentor1->id,  'status' => 'pending',  'notes' => 'Đang trong Step 1 review.'],
                ['application_id' => $app6->id, 'scholarship_id' => $selfUstc, 'requested_by' => $mentor2->id,  'status' => 'approved', 'notes' => 'Đã nộp hồ sơ chính thức.'],
                ['application_id' => $app7->id, 'scholarship_id' => $cscTH,    'requested_by' => $mentor1->id,  'status' => 'approved', 'notes' => 'Sinh viên đã được nhận.'],
            ];

            foreach ($scholarshipRequests as $req) {
                $req['created_at'] = now();
                $req['updated_at'] = now();
                DB::table('scholarship_requests')->updateOrInsert(
                    ['application_id' => $req['application_id'], 'scholarship_id' => $req['scholarship_id']],
                    $req
                );
            }
        }

        $this->command->info('✓ MentorStudentAssignments seeded: 4 records (3 active, 1 historical)');
        $this->command->info('✓ Applications seeded: 8 records (draft/collecting_docs/ready_for_review/review_step_1/review_step_2/submitted/admitted/cancelled)');
        $this->command->info('✓ ScholarshipRequests seeded: 6 records');
    }
}
