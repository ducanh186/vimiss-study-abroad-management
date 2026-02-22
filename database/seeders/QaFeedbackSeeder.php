<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

/**
 * Seeds Q&A (5) and feedback (3) via the notifications table.
 *
 * Notification types used:
 *  - 'qa.question'      — Student asks a question (recipient = mentor/admin)
 *  - 'qa.answer'        — Mentor/admin answers   (recipient = student)
 *  - 'feedback.session' — Student submits session feedback (recipient = admin)
 *
 * data column is JSON with: {from_user_id, from_name, subject, message, application_id?}
 */
class QaFeedbackSeeder extends Seeder
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

        $appIds = $apps->count() >= 6
            ? [$apps[0]->id, $apps[1]->id, $apps[2]->id, $apps[3]->id, $apps[4]->id, $apps[5]->id]
            : [null, null, null, null, null, null];

        $n = fn(int $userId, string $type, array $data, ?string $readAt, int $daysAgo) => [
            'id'         => (string) Str::uuid(),
            'user_id'    => $userId,
            'type'       => $type,
            'data'       => json_encode($data),
            'read_at'    => $readAt,
            'created_at' => now()->subDays($daysAgo),
            'updated_at' => now()->subDays($daysAgo),
        ];

        // ------------------------------------------------------------------
        // Q&A — 5 notifications (questions & answers)
        // ------------------------------------------------------------------
        $notifications = [
            // Q1: student1 hỏi mentor1 về yêu cầu HSK
            $n(
                $mentor1->id,
                'qa.question',
                [
                    'from_user_id'   => $s1->id,
                    'from_name'      => 'Phạm Văn Sinh Viên A',
                    'subject'        => 'Hỏi về yêu cầu HSK cho CSC Bắc Kinh',
                    'message'        => 'Em hiện có HSK4 band 4. Liệu điểm này có đủ để apply CSC Đại học Bắc Kinh không ạ? Hay cần phải thi thêm HSK5?',
                    'application_id' => $appIds[1],
                ],
                now()->subDays(9)->toDateTimeString(),
                10
            ),
            // A1: mentor1 trả lời
            $n(
                $s1->id,
                'qa.answer',
                [
                    'from_user_id'   => $mentor1->id,
                    'from_name'      => 'Trần Thị Mentor A',
                    'subject'        => 'Re: Hỏi về yêu cầu HSK cho CSC Bắc Kinh',
                    'message'        => 'HSK4 band 4 là đủ điều kiện tối thiểu cho CSC Bắc Kinh. Tuy nhiên để tăng cạnh tranh, em nên cân nhắc thi thêm HSK5 vì nhiều ứng viên khác cũng có HSK5. Thầy sẽ hỗ trợ em trong kế hoạch chuẩn bị.',
                    'application_id' => $appIds[1],
                ],
                null,
                9
            ),
            // Q2: student2 hỏi admin về deadlines
            $n(
                $admin->id,
                'qa.question',
                [
                    'from_user_id'   => $s2->id,
                    'from_name'      => 'Hoàng Thị Sinh Viên B',
                    'subject'        => 'Deadline CIS Bắc Kinh có thể gia hạn không?',
                    'message'        => 'Em thấy deadline CIS Bắc Kinh là 31/03/2026. Hộ chiếu em đang làm, dự kiến xong 15/03 mới nhận được. Nếu trễ thì có được gia hạn không ạ?',
                    'application_id' => $appIds[2],
                ],
                null,
                6
            ),
            // Q3: student3 hỏi mentor2 về phương án dự phòng
            $n(
                $mentor2->id,
                'qa.question',
                [
                    'from_user_id'   => $s3->id,
                    'from_name'      => 'Đỗ Văn Sinh Viên C',
                    'subject'        => 'Nếu USTC không nhận thì nên apply trường nào?',
                    'message'        => 'Em đã nộp hồ sơ USTC rồi. Nhỡ không đậu thì em có thể apply thêm Triết Giang tự túc không? Deadline còn đến 15/07 đúng không ạ?',
                    'application_id' => $appIds[4],
                ],
                now()->subDays(3)->toDateTimeString(),
                4
            ),
            // A3: mentor2 trả lời
            $n(
                $s3->id,
                'qa.answer',
                [
                    'from_user_id'   => $mentor2->id,
                    'from_name'      => 'Lê Văn Mentor B',
                    'subject'        => 'Re: Nếu USTC không nhận thì nên apply trường nào?',
                    'message'        => 'Đúng rồi em, deadline Triết Giang tự túc là 15/07/2026. Em đủ điều kiện (HSK5 + GPA 3.8) và hồ sơ đã hoàn chỉnh. Thầy sẽ tạo hồ sơ dự phòng cho em trong tuần tới.',
                    'application_id' => $appIds[4],
                ],
                null,
                3
            ),
        ];

        // ------------------------------------------------------------------
        // Feedback — 3 notifications (student → admin)
        // ------------------------------------------------------------------
        $notifications = array_merge($notifications, [
            $n(
                $admin->id,
                'feedback.session',
                [
                    'from_user_id'   => $s1->id,
                    'from_name'      => 'Phạm Văn Sinh Viên A',
                    'subject'        => 'Feedback buổi tư vấn với Mentor A',
                    'message'        => 'Buổi gặp hôm nay rất hữu ích. Thầy Mentor A giải thích rõ ràng từng bước chuẩn bị hồ sơ CSC. Tuy nhiên em mong được nhận thêm template kế hoạch học tập mẫu để tham khảo.',
                    'rating'         => 4,
                    'mentor_id'      => $mentor1->id,
                ],
                now()->subDays(1)->toDateTimeString(),
                1
            ),
            $n(
                $admin->id,
                'feedback.session',
                [
                    'from_user_id'   => $s2->id,
                    'from_name'      => 'Hoàng Thị Sinh Viên B',
                    'subject'        => 'Feedback buổi review hồ sơ CIS',
                    'message'        => 'Thầy Mentor B rất tận tình và chi tiết. Hồ sơ của em đã được review kỹ lưỡng. Chỉ mong hệ thống có thể thông báo realtime khi có cập nhật trạng thái hồ sơ.',
                    'rating'         => 5,
                    'mentor_id'      => $mentor2->id,
                ],
                null,
                3
            ),
            $n(
                $admin->id,
                'feedback.session',
                [
                    'from_user_id'   => $s3->id,
                    'from_name'      => 'Đỗ Văn Sinh Viên C',
                    'subject'        => 'Feedback sau khi nộp hồ sơ USTC',
                    'message'        => 'Rất hài lòng với quá trình hỗ trợ. Quy trình rõ ràng, tài liệu được review nghiêm túc. Góp ý thêm: nên có checklist bắt buộc để sinh viên không thiếu giấy tờ.',
                    'rating'         => 5,
                    'mentor_id'      => $mentor2->id,
                ],
                now()->subDays(2)->toDateTimeString(),
                2
            ),
        ]);

        DB::table('notifications')->insert($notifications);

        $this->command->info('✓ Q&A notifications seeded: 5 records');
        $this->command->info('✓ Feedback notifications seeded: 3 records');
        $this->command->info('  (stored in notifications table — type: qa.question / qa.answer / feedback.session)');
    }
}
