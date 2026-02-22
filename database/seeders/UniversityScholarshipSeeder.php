<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

/**
 * Seeds 5 universities and 9 scholarships covering:
 *   CSC, CIS, self-funded (SELF), other (UNI)
 * At least 2 scholarships have past deadlines → status EXPIRED
 */
class UniversityScholarshipSeeder extends Seeder
{
    public function run(): void
    {
        // ------------------------------------------------------------------
        // Universities
        // ------------------------------------------------------------------
        $universities = [
            [
                'name'        => 'Đại học Bắc Kinh',
                'country'     => 'Trung Quốc',
                'city'        => 'Bắc Kinh',
                'ranking'     => 1,
                'programs'    => json_encode(['Khoa học Máy tính', 'Kỹ thuật Điện tử', 'Kinh tế', 'Quản trị Kinh doanh']),
                'description' => 'Một trong những trường đại học danh tiếng nhất Trung Quốc, thành lập năm 1898.',
                'website'     => 'https://www.pku.edu.cn',
                'is_active'   => true,
                'created_at'  => now(), 'updated_at' => now(),
            ],
            [
                'name'        => 'Đại học Thanh Hoa',
                'country'     => 'Trung Quốc',
                'city'        => 'Bắc Kinh',
                'ranking'     => 2,
                'programs'    => json_encode(['Kỹ thuật Phần mềm', 'Cơ học', 'Vật lý', 'Toán ứng dụng']),
                'description' => 'Trường kỹ thuật hàng đầu Trung Quốc, nổi tiếng về STEM và nghiên cứu công nghệ.',
                'website'     => 'https://www.tsinghua.edu.cn',
                'is_active'   => true,
                'created_at'  => now(), 'updated_at' => now(),
            ],
            [
                'name'        => 'Đại học Phúc Đán',
                'country'     => 'Trung Quốc',
                'city'        => 'Thượng Hải',
                'ranking'     => 3,
                'programs'    => json_encode(['Khoa học Máy tính', 'Y khoa', 'Luật', 'Kinh tế']),
                'description' => 'Trường đại học nghiên cứu tổng hợp hàng đầu tại Thượng Hải.',
                'website'     => 'https://www.fudan.edu.cn',
                'is_active'   => true,
                'created_at'  => now(), 'updated_at' => now(),
            ],
            [
                'name'        => 'Đại học Triết Giang',
                'country'     => 'Trung Quốc',
                'city'        => 'Hàng Châu',
                'ranking'     => 4,
                'programs'    => json_encode(['Công nghệ Thông tin', 'Sinh học', 'Nông nghiệp', 'Quản lý']),
                'description' => 'Đại học đa ngành nằm tại thành phố Hàng Châu, tỉnh Triết Giang.',
                'website'     => 'https://www.zju.edu.cn',
                'is_active'   => true,
                'created_at'  => now(), 'updated_at' => now(),
            ],
            [
                'name'        => 'Đại học Khoa học và Công nghệ Trung Quốc (USTC)',
                'country'     => 'Trung Quốc',
                'city'        => 'Hợp Phì',
                'ranking'     => 7,
                'programs'    => json_encode(['Vật lý', 'Khoa học Vật liệu', 'Toán học', 'Khoa học Máy tính']),
                'description' => 'Trường KHCN trực thuộc Viện Hàn lâm Khoa học Trung Quốc. Nổi tiếng về nghiên cứu cơ bản.',
                'website'     => 'https://www.ustc.edu.cn',
                'is_active'   => true,
                'created_at'  => now(), 'updated_at' => now(),
            ],
        ];

        // Insert universities (skip if already exist by name)
        foreach ($universities as $uni) {
            DB::table('universities')->updateOrInsert(['name' => $uni['name']], $uni);
        }

        // Reload IDs
        $ids = DB::table('universities')
            ->whereIn('name', array_column($universities, 'name'))
                ->pluck('id', 'name');

        $bkId    = $ids['Đại học Bắc Kinh'];
        $thId    = $ids['Đại học Thanh Hoa'];
        $fdId    = $ids['Đại học Phúc Đán'];
        $zjId    = $ids['Đại học Triết Giang'];
        $ustcId  = $ids['Đại học Khoa học và Công nghệ Trung Quốc (USTC)'];

        // ------------------------------------------------------------------
        // Scholarships — covers CSC, CIS, self-funded (SELF), other (UNI)
        // NOTE: 2 scholarships have deadlines in the past → EXPIRED for tests
        // ------------------------------------------------------------------
        $scholarships = [
            // ── Bắc Kinh ──────────────────────────────────────────────────
            [
                'university_id' => $bkId,
                'name'          => 'Học bổng Chính phủ Trung Quốc (CSC) – Bắc Kinh',
                'type'          => 'CSC',
                'min_hsk_level' => 'HSK4',
                'min_gpa'       => 3.00,
                'deadline'      => '2026-04-30',
                'quota'         => 3,
                'used_quota'    => 1,
                'requirements'  => 'HSK4 trở lên, GPA ≥ 3.0, không quá 35 tuổi',
                'description'   => 'Học bổng toàn phần do Chính phủ Trung Quốc tài trợ.',
                'is_active'     => true,
            ],
            [
                'university_id' => $bkId,
                'name'          => 'Học bổng Trao đổi Văn hoá (CIS) – Bắc Kinh',
                'type'          => 'CIS',
                'min_hsk_level' => 'HSK3',
                'min_gpa'       => 2.80,
                'deadline'      => '2026-03-31',
                'quota'         => 2,
                'used_quota'    => 0,
                'requirements'  => 'HSK3 trở lên, GPA ≥ 2.8, thư giới thiệu từ trường gốc',
                'description'   => 'Học bổng trao đổi 1 năm, hỗ trợ học phí và sinh hoạt phí.',
                'is_active'     => true,
            ],
            // ── Thanh Hoa ─────────────────────────────────────────────────
            [
                'university_id' => $thId,
                'name'          => 'Học bổng Chính phủ Trung Quốc (CSC) – Thanh Hoa',
                'type'          => 'CSC',
                'min_hsk_level' => 'HSK5',
                'min_gpa'       => 3.50,
                'deadline'      => '2026-05-15',
                'quota'         => 2,
                'used_quota'    => 0,
                'requirements'  => 'HSK5 trở lên, GPA ≥ 3.5, nghiên cứu đề xuất cụ thể',
                'description'   => 'Học bổng tiến sĩ/thạc sĩ toàn phần tại Thanh Hoa.',
                'is_active'     => true,
            ],
            [
                'university_id' => $thId,
                'name'          => 'Học bổng Liên kết Đại học (UNI) – Thanh Hoa',
                'type'          => 'other',
                'min_hsk_level' => 'HSK4',
                'min_gpa'       => 3.20,
                'deadline'      => '2026-05-01',
                'quota'         => 5,
                'used_quota'    => 2,
                'requirements'  => 'HSK4 trở lên, GPA ≥ 3.2, thỏa thuận hợp tác giữa hai trường',
                'description'   => 'Học bổng do Đại học Thanh Hoa và đối tác cấp, bao gồm học phí.',
                'is_active'     => true,
            ],
            // ── Phúc Đán – EXPIRED DEADLINES ──────────────────────────────
            [
                'university_id' => $fdId,
                'name'          => 'Học bổng CSC – Phúc Đán [ĐÃ HẾT HẠN]',
                'type'          => 'CSC',
                'min_hsk_level' => 'HSK4',
                'min_gpa'       => 3.20,
                'deadline'      => '2025-12-31',   // ← PAST → EXPIRED
                'quota'         => 3,
                'used_quota'    => 3,
                'requirements'  => 'HSK4 trở lên, GPA ≥ 3.2',
                'description'   => 'Học bổng CSC kỳ 2025, đã đóng nhận hồ sơ.',
                'is_active'     => true,
            ],
            [
                'university_id' => $fdId,
                'name'          => 'Học bổng CIS – Phúc Đán [ĐÃ HẾT HẠN]',
                'type'          => 'CIS',
                'min_hsk_level' => 'HSK3',
                'min_gpa'       => 2.80,
                'deadline'      => '2025-11-30',   // ← PAST → EXPIRED
                'quota'         => 4,
                'used_quota'    => 4,
                'requirements'  => 'HSK3 trở lên, GPA ≥ 2.8',
                'description'   => 'Học bổng CIS kỳ trao đổi 2025, đã đóng nhận hồ sơ.',
                'is_active'     => false,          // deactivated after deadline
            ],
            // ── Triết Giang ───────────────────────────────────────────────
            [
                'university_id' => $zjId,
                'name'          => 'Học bổng CIS – Triết Giang',
                'type'          => 'CIS',
                'min_hsk_level' => 'HSK3',
                'min_gpa'       => 2.50,
                'deadline'      => '2026-06-30',
                'quota'         => 5,
                'used_quota'    => 0,
                'requirements'  => 'HSK3 trở lên, GPA ≥ 2.5',
                'description'   => 'Học bổng trao đổi tại Triết Giang, hỗ trợ học phí một kỳ.',
                'is_active'     => true,
            ],
            [
                'university_id' => $zjId,
                'name'          => 'Chương trình Tự túc (SELF) – Triết Giang',
                'type'          => 'self-funded',
                'min_hsk_level' => 'HSK3',
                'min_gpa'       => 2.50,
                'deadline'      => '2026-07-15',
                'quota'         => null,
                'used_quota'    => 0,
                'requirements'  => 'HSK3 trở lên, tự lo chi phí học tập và sinh hoạt',
                'description'   => 'Chương trình học tự túc, không giới hạn chỉ tiêu.',
                'is_active'     => true,
            ],
            // ── USTC ───────────────────────────────────────────────────────
            [
                'university_id' => $ustcId,
                'name'          => 'Chương trình Tự túc (SELF) – USTC',
                'type'          => 'self-funded',
                'min_hsk_level' => 'HSK3',
                'min_gpa'       => 2.50,
                'deadline'      => '2026-04-15',
                'quota'         => null,
                'used_quota'    => 0,
                'requirements'  => 'HSK3 trở lên, GPA ≥ 2.5, chứng minh tài chính',
                'description'   => 'Chương trình tự túc tại USTC, miễn học phí theo thỏa thuận.',
                'is_active'     => true,
            ],
        ];

        foreach ($scholarships as $scholarship) {
            $scholarship['created_at'] = now();
            $scholarship['updated_at'] = now();
            DB::table('scholarships')->updateOrInsert(
                [
                    'university_id' => $scholarship['university_id'],
                    'name'          => $scholarship['name'],
                ],
                $scholarship
            );
        }

        $this->command->info('✓ Universities seeded: 5 records');
        $this->command->info('✓ Scholarships seeded: 9 records (2 EXPIRED deadlines)');
    }
}
