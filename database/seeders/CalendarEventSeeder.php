<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds 8 calendar_events:
 *  - 3 deadline events (scholarship deadlines)
 *  - 3 meeting/appointment events (mentor–student)
 *  - 1 reminder event
 *  - 1 other event (info session)
 */
class CalendarEventSeeder extends Seeder
{
    public function run(): void
    {
        $admin   = User::where('email', 'admin@vimiss.vn')->firstOrFail();
        $mentor1 = User::where('email', 'mentor1@vimiss.vn')->firstOrFail();
        $mentor2 = User::where('email', 'mentor2@vimiss.vn')->firstOrFail();

        // Clear existing seeded calendar events on re-run
        DB::table('calendar_events')->where('created_by', $admin->id)
            ->orWhere('created_by', $mentor1->id)
            ->orWhere('created_by', $mentor2->id)
            ->delete();

        $events = [
            // ── DEADLINE events ────────────────────────────────────────────
            [
                'created_by'  => $admin->id,
                'title'       => '🔴 Hạn chót CSC Bắc Kinh',
                'description' => 'Deadline nộp hồ sơ học bổng CSC Đại học Bắc Kinh. Tất cả tài liệu phải upload trước 23:59.',
                'start_date'  => '2026-04-30 23:59:00',
                'end_date'    => '2026-04-30 23:59:00',
                'type'        => 'deadline',
                'visibility'  => 'all',
                'created_at'  => now()->subDays(30),
                'updated_at'  => now()->subDays(30),
            ],
            [
                'created_by'  => $admin->id,
                'title'       => '🔴 Hạn chót CSC Thanh Hoa',
                'description' => 'Deadline nộp hồ sơ học bổng CSC Đại học Thanh Hoa (HSK5, GPA ≥ 3.5).',
                'start_date'  => '2026-05-15 23:59:00',
                'end_date'    => '2026-05-15 23:59:00',
                'type'        => 'deadline',
                'visibility'  => 'all',
                'created_at'  => now()->subDays(30),
                'updated_at'  => now()->subDays(30),
            ],
            [
                'created_by'  => $admin->id,
                'title'       => '⚠️ Hạn chót CIS Bắc Kinh — SẮP HẾT',
                'description' => 'Deadline CIS Bắc Kinh chỉ còn ~40 ngày. Mentor cần xúc tiến hồ sơ.',
                'start_date'  => '2026-03-31 23:59:00',
                'end_date'    => '2026-03-31 23:59:00',
                'type'        => 'deadline',
                'visibility'  => 'mentor',
                'created_at'  => now()->subDays(14),
                'updated_at'  => now()->subDays(14),
            ],
            // ── MEETING / APPOINTMENT events ───────────────────────────────
            [
                'created_by'  => $mentor1->id,
                'title'       => 'Cuộc hẹn: Mentor1 × Phạm Văn Sinh Viên A',
                'description' => 'Chủ đề: Hoàn thiện kế hoạch học tập CSC + cảnh báo hộ chiếu gần hết hạn. Meeting qua Google Meet.',
                'start_date'  => now()->addDays(3)->format('Y-m-d 14:00:00'),
                'end_date'    => now()->addDays(3)->format('Y-m-d 15:00:00'),
                'type'        => 'meeting',
                'visibility'  => 'mentor',
                'created_at'  => now()->subDays(2),
                'updated_at'  => now()->subDays(2),
            ],
            [
                'created_by'  => $mentor2->id,
                'title'       => 'Cuộc hẹn: Mentor2 × Hoàng Thị Sinh Viên B',
                'description' => 'Review hồ sơ CIS Triết Giang lần cuối trước khi submit. Meeting trực tiếp tại văn phòng.',
                'start_date'  => now()->addDays(7)->format('Y-m-d 09:30:00'),
                'end_date'    => now()->addDays(7)->format('Y-m-d 10:30:00'),
                'type'        => 'meeting',
                'visibility'  => 'mentor',
                'created_at'  => now()->subDays(1),
                'updated_at'  => now()->subDays(1),
            ],
            [
                'created_by'  => $mentor2->id,
                'title'       => 'Cuộc hẹn: Mentor2 × Đỗ Văn Sinh Viên C — Follow-up USTC',
                'description' => 'Theo dõi kết quả sau khi nộp hồ sơ USTC. Thảo luận phương án dự phòng nếu không trúng tuyển.',
                'start_date'  => now()->addDays(14)->format('Y-m-d 15:00:00'),
                'end_date'    => now()->addDays(14)->format('Y-m-d 16:00:00'),
                'type'        => 'meeting',
                'visibility'  => 'mentor',
                'created_at'  => now(),
                'updated_at'  => now(),
            ],
            // ── REMINDER event ─────────────────────────────────────────────
            [
                'created_by'  => $admin->id,
                'title'       => '🔔 Nhắc nhở: Gia hạn hộ chiếu — Phạm Văn A',
                'description' => 'Hộ chiếu sinh viên student1 hết hạn 10/04/2026. Nhắc sinh viên nộp hồ sơ gia hạn tại cơ quan xuất nhập cảnh trước 01/03/2026.',
                'start_date'  => '2026-03-01 08:00:00',
                'end_date'    => null,
                'type'        => 'reminder',
                'visibility'  => 'admin',
                'created_at'  => now()->subDays(5),
                'updated_at'  => now()->subDays(5),
            ],
            // ── OTHER event ────────────────────────────────────────────────
            [
                'created_by'  => $admin->id,
                'title'       => 'Webinar: Hướng dẫn nộp hồ sơ CSC 2026',
                'description' => 'Buổi hướng dẫn trực tuyến cho tất cả sinh viên và mentor về quy trình nộp hồ sơ học bổng CSC 2026. Link: https://meet.vimiss.vn/csc2026',
                'start_date'  => now()->addDays(5)->format('Y-m-d 19:00:00'),
                'end_date'    => now()->addDays(5)->format('Y-m-d 21:00:00'),
                'type'        => 'other',
                'visibility'  => 'all',
                'created_at'  => now()->subDays(7),
                'updated_at'  => now()->subDays(7),
            ],
        ];

        DB::table('calendar_events')->insert($events);

        $this->command->info('✓ CalendarEvents seeded: ' . count($events) . ' records');
        $this->command->info('  ↳ 3 deadlines, 3 meetings, 1 reminder, 1 webinar');
    }
}
