<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds 6–8 documents per application with varied label_status values.
 * Highlights:
 *  - App 2 (NEED_DOCS): passport note "gần hết hạn 10/04/2026"
 *  - All label_status variants covered across the dataset
 *  - Simulated file_path using path convention: documents/app-{id}/{type}.pdf
 */
class ApplicationDocumentSeeder extends Seeder
{
    public function run(): void
    {
        $admin   = User::where('email', 'admin@vimiss.vn')->firstOrFail();
        $mentor1 = User::where('email', 'mentor1@vimiss.vn')->firstOrFail();
        $mentor2 = User::where('email', 'mentor2@vimiss.vn')->firstOrFail();
        $s1      = User::where('email', 'student1@vimiss.vn')->firstOrFail();
        $s2      = User::where('email', 'student2@vimiss.vn')->firstOrFail();
        $s3      = User::where('email', 'student3@vimiss.vn')->firstOrFail();

        // Load applications in insertion order (same order as ApplicationSeeder)
        $apps = DB::table('applications')
            ->whereIn('student_id', [$s1->id, $s2->id, $s3->id])
            ->orderBy('id')
            ->get();

        if ($apps->count() < 6) {
            $this->command->error('Applications not found — run ApplicationSeeder first.');
            return;
        }

        [$a1, $a2, $a3, $a4, $a5, $a6] = [$apps[0], $apps[1], $apps[2], $apps[3], $apps[4], $apps[5]];

        // Helper: build a document row
        $doc = fn(int $appId, int $uploadedBy, string $type, string $labelStatus, string $notes, int $daysAgo = 5) => [
            'application_id' => $appId,
            'uploaded_by'    => $uploadedBy,
            'file_path'      => "documents/app-{$appId}/{$type}.pdf",
            'original_name'  => $type . '_' . $appId . '.pdf',
            'mime_type'      => 'application/pdf',
            'file_size'      => rand(150000, 3000000),
            'type'           => $type,
            'label_status'   => $labelStatus,
            'notes'          => $notes,
            'created_at'     => now()->subDays($daysAgo),
            'updated_at'     => now()->subDays(max(0, $daysAgo - 2)),
        ];

        // ------------------------------------------------------------------
        // App 1 — DRAFT — student1/mentor1 — 6 docs (pending_review, need_more)
        // ------------------------------------------------------------------
        $documents = [
            $doc($a1->id, $s1->id,      'passport',           'pending_review', 'Hộ chiếu đã upload, chờ mentor xác nhận.', 38),
            $doc($a1->id, $s1->id,      'transcript',         'need_more',      'Bảng điểm chưa có công chứng. Cần bản công chứng tiếng Anh.', 37),
            $doc($a1->id, $mentor1->id, 'hsk_cert',           'pending_review', 'Chứng chỉ HSK4 đã upload.', 36),
            $doc($a1->id, $s1->id,      'recommendation',     'pending_review', 'Thư giới thiệu từ giảng viên hướng dẫn.', 35),
            $doc($a1->id, $mentor1->id, 'personal_statement', 'need_more',      'Bản kế hoạch học tập còn sơ lược. Cần viết lại phần mục tiêu nghiên cứu.', 34),
            $doc($a1->id, $s1->id,      'other',              'pending_review', 'Chứng minh thư / CCCD.', 33),
        ];

        // ------------------------------------------------------------------
        // App 2 — NEED_DOCS — student1/mentor1 — 7 docs, PASSPORT gần hết hạn
        // ------------------------------------------------------------------
        $documents = array_merge($documents, [
            $doc($a2->id, $s1->id,      'passport',           'need_more',
                '⚠️ CẢNH BÁO: Hộ chiếu hết hạn 10/04/2026 (còn ~50 ngày). Sinh viên cần gia hạn trước khi nộp hồ sơ.',
                10),
            $doc($a2->id, $s1->id,      'transcript',         'valid',          'Bảng điểm ĐH đã công chứng, hợp lệ.', 9),
            $doc($a2->id, $s1->id,      'hsk_cert',           'valid',          'Chứng chỉ HSK4 band 4, còn hiệu lực 2027.', 8),
            $doc($a2->id, $mentor1->id, 'recommendation',     'translating',    'Đang dịch thư giới thiệu sang tiếng Trung.', 7),
            $doc($a2->id, $mentor1->id, 'personal_statement', 'translating',    'Đang dịch kế hoạch học tập sang tiếng Trung.', 7),
            $doc($a2->id, $s1->id,      'other',              'need_more',      'Ảnh thẻ 3x4 không đúng nền trắng. Yêu cầu chụp lại.', 6),
            $doc($a2->id, $mentor1->id, 'other',              'pending_review', 'Mẫu đơn xin học bổng (form CSC).', 5),
        ]);

        // ------------------------------------------------------------------
        // App 3 — TRANSLATING / in_progress — student2/mentor1 — 6 docs
        // ------------------------------------------------------------------
        $documents = array_merge($documents, [
            $doc($a3->id, $s2->id,      'passport',           'valid',          'Hộ chiếu mới đang làm, dùng tạm photo có xác nhận.', 20),
            $doc($a3->id, $s2->id,      'transcript',         'valid',          'Bảng điểm tiếng Anh đã ký tươi.', 19),
            $doc($a3->id, $mentor1->id, 'hsk_cert',           'valid',          'HSK3 còn hiệu lực.', 18),
            $doc($a3->id, $mentor1->id, 'recommendation',     'translating',    'Đang dịch thư giới thiệu sang tiếng Trung.', 17),
            $doc($a3->id, $mentor1->id, 'personal_statement', 'translating',    'Bản dịch kế hoạch học tập đang hoàn thiện.', 16),
            $doc($a3->id, $s2->id,      'other',              'pending_review', 'Học bạ THPT.', 15),
        ]);

        // ------------------------------------------------------------------
        // App 4 — VALID / documents_reviewing — student2/mentor2 — 7 docs
        // ------------------------------------------------------------------
        $documents = array_merge($documents, [
            $doc($a4->id, $s2->id,      'passport',           'valid',          'Hộ chiếu mới (dự kiến nhận 15/03/2026). Đã upload photo tạm.', 5),
            $doc($a4->id, $s2->id,      'transcript',         'valid',          'Bảng điểm đã công chứng và dịch thuật hợp lệ.', 5),
            $doc($a4->id, $s2->id,      'hsk_cert',           'valid',          'HSK3, còn hiệu lực đến 2027.', 4),
            $doc($a4->id, $mentor2->id, 'recommendation',     'valid',          'Thư giới thiệu đã dịch và đóng dấu trường.', 4),
            $doc($a4->id, $mentor2->id, 'personal_statement', 'valid',          'Kế hoạch học tập CIS đã hoàn chỉnh.', 3),
            $doc($a4->id, $mentor2->id, 'other',              'valid',          'Form đăng ký CIS hoàn chỉnh đầy đủ mục.', 3),
            $doc($a4->id, $mentor2->id, 'other',              'pending_review', 'Chứng minh tài chính (sao kê ngân hàng).', 2),
        ]);

        // ------------------------------------------------------------------
        // App 5 — SUBMITTED — student3/mentor2 — 8 docs
        // ------------------------------------------------------------------
        $documents = array_merge($documents, [
            $doc($a5->id, $s3->id,      'passport',           'submitted',      'Hộ chiếu hợp lệ đến 2028, đã nộp bản sao chứng thực.', 30),
            $doc($a5->id, $s3->id,      'transcript',         'submitted',      'Bảng điểm tốt nghiệp ĐH, điểm xuất sắc.', 28),
            $doc($a5->id, $s3->id,      'hsk_cert',           'submitted',      'HSK5 band 5, còn hiệu lực đến 2027.', 26),
            $doc($a5->id, $mentor2->id, 'recommendation',     'submitted',      'Thư giới thiệu từ GS hướng dẫn.', 24),
            $doc($a5->id, $mentor2->id, 'personal_statement', 'submitted',      'Kế hoạch nghiên cứu chi tiết ngành KHMT.', 22),
            $doc($a5->id, $s3->id,      'other',              'submitted',      'Chứng minh tài chính đầy đủ.', 20),
            $doc($a5->id, $mentor2->id, 'other',              'submitted',      'Giấy xác nhận đăng ký học bổng SELF USTC.', 18),
            $doc($a5->id, $mentor2->id, 'other',              'submitted',      'Phiếu kết quả sức khoẻ.', 16),
        ]);

        // ------------------------------------------------------------------
        // App 6 — ON_HOLD_NEEDS_MENTOR — student3/admin — 6 docs (pending)
        // ------------------------------------------------------------------
        $documents = array_merge($documents, [
            $doc($a6->id, $s3->id,   'passport',           'pending_review', 'Hộ chiếu hợp lệ, chờ xác nhận sau khi có mentor.', 3),
            $doc($a6->id, $s3->id,   'transcript',         'pending_review', 'Bảng điểm mới nhất.', 3),
            $doc($a6->id, $s3->id,   'hsk_cert',           'pending_review', 'HSK5, còn hiệu lực.', 3),
            $doc($a6->id, $admin->id,'recommendation',     'need_more',      'Cần thư giới thiệu từ GS phụ trách.', 2),
            $doc($a6->id, $admin->id,'personal_statement', 'need_more',      'Kế hoạch học tập chưa hoàn chỉnh. Chờ mentor hướng dẫn.', 2),
            $doc($a6->id, $s3->id,   'other',              'pending_review', 'CCCD bản sao chứng thực.', 1),
        ]);

        // Clear existing documents for these applications on re-run
        DB::table('application_documents')
            ->whereIn('application_id', [$a1->id, $a2->id, $a3->id, $a4->id, $a5->id, $a6->id])
            ->delete();

        DB::table('application_documents')->insert($documents);

        $this->command->info('✓ ApplicationDocuments seeded: ' . count($documents) . ' records across 6 applications');
        $this->command->info('  ↳ App 2: passport "gần hết hạn 10/04/2026" flagged');
    }
}
