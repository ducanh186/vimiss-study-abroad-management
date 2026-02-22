<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds 3 review_requests:
 *  1. study_plan   — document_review   — approved (mentor2 → admin)
 *  2. translation  — document_review   — rejected (mentor1 → admin)
 *  3. special_scholarship — scholarship_approval — approved (mentor2 → director)
 */
class ReviewRequestSeeder extends Seeder
{
    public function run(): void
    {
        $admin    = User::where('email', 'admin@vimiss.vn')->firstOrFail();
        $director = User::where('email', 'director@vimiss.vn')->firstOrFail();
        $mentor1  = User::where('email', 'mentor1@vimiss.vn')->firstOrFail();
        $mentor2  = User::where('email', 'mentor2@vimiss.vn')->firstOrFail();
        $s1       = User::where('email', 'student1@vimiss.vn')->firstOrFail();
        $s2       = User::where('email', 'student2@vimiss.vn')->firstOrFail();
        $s3       = User::where('email', 'student3@vimiss.vn')->firstOrFail();

        $apps = DB::table('applications')
            ->whereIn('student_id', [$s1->id, $s2->id, $s3->id])
            ->orderBy('id')
            ->get();

        if ($apps->count() < 6) {
            $this->command->error('Applications not found — run ApplicationSeeder first.');
            return;
        }

        [$a1, $a2, $a3, $a4, $a5, $a6] = [$apps[0], $apps[1], $apps[2], $apps[3], $apps[4], $apps[5]];

        // Clear existing review requests for these apps on re-run
        DB::table('review_requests')
            ->whereIn('application_id', [$a1->id, $a2->id, $a3->id, $a4->id, $a5->id, $a6->id])
            ->delete();

        $requests = [
            // 1. Study plan document review — App 5 (submitted) — APPROVED by Admin
            [
                'application_id' => $a5->id,
                'submitted_by'   => $mentor2->id,
                'reviewed_by'    => $admin->id,
                'type'           => 'document_review',
                'status'         => 'approved',
                'submit_notes'   => 'Kế hoạch học tập của sinh viên đã hoàn chỉnh. Đề nghị admin duyệt để nộp hồ sơ.',
                'review_notes'   => 'Kế hoạch học tập rõ ràng, mục tiêu nghiên cứu cụ thể. ĐÃ DUYỆT.',
                'reviewed_at'    => now()->subDays(8),
                'created_at'     => now()->subDays(12),
                'updated_at'     => now()->subDays(8),
            ],
            // 2. Translation document review — App 3 (in_progress) — REJECTED by Admin
            [
                'application_id' => $a3->id,
                'submitted_by'   => $mentor1->id,
                'reviewed_by'    => $admin->id,
                'type'           => 'document_review',
                'status'         => 'rejected',
                'submit_notes'   => 'Bản dịch hồ sơ sang tiếng Trung đã xong, đề nghị admin kiểm tra.',
                'review_notes'   => 'Bản dịch còn lỗi thuật ngữ chuyên ngành. Cần hiệu đính lại phần mô tả nghiên cứu. TỪ CHỐI.',
                'reviewed_at'    => now()->subDays(15),
                'created_at'     => now()->subDays(20),
                'updated_at'     => now()->subDays(15),
            ],
            // 3. Special scholarship approval — App 4 (documents_reviewing) — APPROVED by Director
            [
                'application_id' => $a4->id,
                'submitted_by'   => $mentor2->id,
                'reviewed_by'    => $director->id,
                'type'           => 'scholarship_approval',
                'status'         => 'approved',
                'submit_notes'   => 'Sinh viên đủ điều kiện học bổng CIS Triết Giang đặc biệt. Đề nghị giám đốc phê duyệt.',
                'review_notes'   => 'Hồ sơ đáp ứng đầy đủ tiêu chuẩn CIS. Phê duyệt học bổng đặc biệt cho sinh viên. — Giám đốc đã ký.',
                'reviewed_at'    => now()->subDays(3),
                'created_at'     => now()->subDays(6),
                'updated_at'     => now()->subDays(3),
            ],
        ];

        DB::table('review_requests')->insert($requests);

        $this->command->info('✓ ReviewRequests seeded: 3 records');
        $this->command->info('  ↳ study_plan: APPROVED (admin)');
        $this->command->info('  ↳ translation: REJECTED (admin)');
        $this->command->info('  ↳ special_scholarship: APPROVED (director-only)');
    }
}
