<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds 4–7 application_history entries per application (total ~36 records).
 * Simulates realistic status transitions, note edits, and document events.
 */
class ApplicationHistorySeeder extends Seeder
{
    public function run(): void
    {
        $admin   = User::where('email', 'admin@vimiss.vn')->firstOrFail();
        $mentor1 = User::where('email', 'mentor1@vimiss.vn')->firstOrFail();
        $mentor2 = User::where('email', 'mentor2@vimiss.vn')->firstOrFail();
        $s1      = User::where('email', 'student1@vimiss.vn')->firstOrFail();
        $s2      = User::where('email', 'student2@vimiss.vn')->firstOrFail();
        $s3      = User::where('email', 'student3@vimiss.vn')->firstOrFail();

        $apps = DB::table('applications')
            ->whereIn('student_id', [$s1->id, $s2->id, $s3->id])
            ->orderBy('id')
            ->get();

        if ($apps->count() < 6) {
            $this->command->error('Applications not found — run ApplicationSeeder first.');
            return;
        }

        [$a1, $a2, $a3, $a4, $a5, $a6] = [$apps[0], $apps[1], $apps[2], $apps[3], $apps[4], $apps[5]];

        // Remove existing histories for these apps on re-run
        DB::table('application_histories')
            ->whereIn('application_id', [$a1->id, $a2->id, $a3->id, $a4->id, $a5->id, $a6->id])
            ->delete();

        $h = fn(int $appId, int $by, string $field, ?string $old, ?string $new, string $notes, int $daysAgo) => [
            'application_id' => $appId,
            'changed_by'     => $by,
            'field_changed'  => $field,
            'old_value'      => $old,
            'new_value'      => $new,
            'notes'          => $notes,
            'created_at'     => now()->subDays($daysAgo),
            'updated_at'     => now()->subDays($daysAgo),
        ];

        $histories = [];

        // ==================================================================
        // App 1 — DRAFT (5 entries)
        // ==================================================================
        $histories = array_merge($histories, [
            $h($a1->id, $mentor1->id, 'status',    null,       'draft',              'Hồ sơ được khởi tạo bởi mentor.',                40),
            $h($a1->id, $mentor1->id, 'notes',     null,       'CSC Bắc Kinh',       'Mentor ghi chú học bổng mục tiêu.',               39),
            $h($a1->id, $mentor1->id, 'document',  null,       'passport',           'Sinh viên upload hộ chiếu lần đầu.',              38),
            $h($a1->id, $mentor1->id, 'document',  null,       'transcript',         'Upload bảng điểm — chưa công chứng.',             37),
            $h($a1->id, $s1->id,      'notes',     'CSC Bắc Kinh', 'CSC Bắc Kinh — đang bổ sung giấy tờ', 'Sinh viên cập nhật ghi chú.', 36),
        ]);

        // ==================================================================
        // App 2 — NEED_DOCS / documents_pending (6 entries)
        // ==================================================================
        $histories = array_merge($histories, [
            $h($a2->id, $mentor1->id, 'status',   null,                  'draft',              'Khởi tạo hồ sơ thứ 2 cho sinh viên (CSC Bắc Kinh đường song song).', 35),
            $h($a2->id, $mentor1->id, 'status',   'draft',               'documents_pending',  'Chuyển sang chờ tài liệu sau khi kiểm tra danh sách giấy tờ.',        32),
            $h($a2->id, $mentor1->id, 'document', null,                  'passport',           '⚠️ Upload hộ chiếu — phát hiện hết hạn 10/04/2026.',               10),
            $h($a2->id, $mentor1->id, 'notes',    null,                  'Cần gia hạn hộ chiếu trước 31/03', 'Mentor thêm cảnh báo hộ chiếu gần hết hạn.',          10),
            $h($a2->id, $mentor1->id, 'document', null,                  'recommendation',     'Đang dịch thư giới thiệu sang tiếng Trung.',                          7),
            $h($a2->id, $s1->id,      'document', null,                  'other',              'Sinh viên upload ảnh thẻ — cần chụp lại (nền không trắng).',          6),
        ]);

        // ==================================================================
        // App 3 — TRANSLATING / in_progress (7 entries)
        // ==================================================================
        $histories = array_merge($histories, [
            $h($a3->id, $mentor1->id, 'status',   null,                  'draft',              'Khởi tạo hồ sơ CIS Bắc Kinh.',                                      50),
            $h($a3->id, $s2->id,      'document', null,                  'transcript',         'Upload bảng điểm tiếng Anh.',                                         48),
            $h($a3->id, $s2->id,      'document', null,                  'hsk_cert',           'Upload chứng chỉ HSK3.',                                              46),
            $h($a3->id, $mentor1->id, 'status',   'draft',               'documents_pending',  'Đủ giấy tờ cơ bản, chuyển sang chờ dịch thuật.',                     40),
            $h($a3->id, $mentor1->id, 'status',   'documents_pending',   'in_progress',        'Đã nhận bản dịch thư giới thiệu, đang xử lý.',                       25),
            $h($a3->id, $mentor1->id, 'document', null,                  'recommendation',     'Đưa vào dịch thuật tiếng Trung.',                                     20),
            $h($a3->id, $admin->id,   'notes',    null,                  'Translation rejected — cần hiệu đính thuật ngữ', 'Admin ghi nhận yêu cầu từ chối dịch.',   15),
        ]);

        // ==================================================================
        // App 4 — VALID / documents_reviewing (6 entries)
        // ==================================================================
        $histories = array_merge($histories, [
            $h($a4->id, $mentor2->id, 'status',   null,                  'draft',              'Khởi tạo hồ sơ CIS Triết Giang sau khi chuyển mentor.',               25),
            $h($a4->id, $s2->id,      'document', null,                  'passport',           'Upload photo hộ chiếu tạm (hộ chiếu mới đang làm).',                  23),
            $h($a4->id, $mentor2->id, 'document', null,                  'recommendation',     'Thư giới thiệu đã dịch và đóng dấu trường.',                          15),
            $h($a4->id, $mentor2->id, 'status',   'draft',               'documents_pending',  'Đủ tài liệu ban đầu, chờ sinh viên bổ sung chứng minh tài chính.',     12),
            $h($a4->id, $s2->id,      'document', null,                  'other',              'Upload sao kê ngân hàng 6 tháng gần nhất.',                            8),
            $h($a4->id, $mentor2->id, 'status',   'documents_pending',   'documents_reviewing','Tất cả giấy tờ đầy đủ, chuyển sang review lần cuối.',                   5),
        ]);

        // ==================================================================
        // App 5 — SUBMITTED (7 entries)
        // ==================================================================
        $histories = array_merge($histories, [
            $h($a5->id, $mentor2->id, 'status',   null,                  'draft',              'Khởi tạo hồ sơ tự túc USTC.',                                         90),
            $h($a5->id, $s3->id,      'document', null,                  'passport',           'Upload hộ chiếu còn hạn đến 2028.',                                    85),
            $h($a5->id, $s3->id,      'document', null,                  'transcript',         'Upload bảng điểm tốt nghiệp ĐH.',                                      80),
            $h($a5->id, $mentor2->id, 'status',   'draft',               'documents_pending',  'Đã kiểm tra, thiếu thư giới thiệu và kế hoạch học tập.',               70),
            $h($a5->id, $mentor2->id, 'status',   'documents_pending',   'documents_reviewing','Đủ hồ sơ, thực hiện review nội bộ.',                                    20),
            $h($a5->id, $admin->id,   'status',   'documents_reviewing', 'submitted_to_university', 'Admin xác nhận và nộp hồ sơ chính thức lên USTC ngày 14/02/2026.', 5),
            $h($a5->id, $mentor2->id, 'notes',    null,                  'Đã nộp — chờ phản hồi từ trường trong 4–6 tuần', 'Mentor ghi chú sau khi nộp.',              5),
        ]);

        // ==================================================================
        // App 6 — ON_HOLD_NEEDS_MENTOR (4 entries)
        // ==================================================================
        $histories = array_merge($histories, [
            $h($a6->id, $admin->id,   'status',   null,                  'draft',              'Admin khởi tạo hồ sơ CSC Thanh Hoa cho sinh viên.',                    3),
            $h($a6->id, $admin->id,   'status',   'draft',               'on_hold_needs_mentor',  'Chưa có mentor phù hợp. Chờ assign mentor.',                       3),
            $h($a6->id, $s3->id,      'document', null,                  'passport',           'Sinh viên chủ động upload hộ chiếu trong khi chờ.',                    2),
            $h($a6->id, $admin->id,   'notes',    null,                  '[TODO] Assign mentor CSC cho student3', 'Admin ghi chú nội bộ về việc assign mentor.',     1),
        ]);

        DB::table('application_histories')->insert($histories);

        $this->command->info('✓ ApplicationHistories seeded: ' . count($histories) . ' records (4–7 per application)');
    }
}
