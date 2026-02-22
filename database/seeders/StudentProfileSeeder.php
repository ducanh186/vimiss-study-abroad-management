<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class StudentProfileSeeder extends Seeder
{
    public function run(): void
    {
        $student1 = User::where('email', 'student1@vimiss.vn')->firstOrFail();
        $student2 = User::where('email', 'student2@vimiss.vn')->firstOrFail();
        $student3 = User::where('email', 'student3@vimiss.vn')->firstOrFail();

        $profiles = [
            [
                'user_id'                  => $student1->id,
                'phone'                    => '0901234567',
                'date_of_birth'            => '2001-03-15',
                'passport_status'          => 'valid',
                // Passport expires 2026-04-10 — chỉ còn ~50 ngày → cảnh báo "gần hết hạn"
                'gpa'                      => 3.55,
                'hsk_level'                => 'HSK4',
                'hskk_level'               => 'HSKK-intermediate',
                'desired_scholarship_type' => 'CSC',
                'notes'                    => 'Hộ chiếu hết hạn 10/04/2026 — cần gia hạn trước khi nộp hồ sơ.',
                'created_at'               => now(),
                'updated_at'               => now(),
            ],
            [
                'user_id'                  => $student2->id,
                'phone'                    => '0912345678',
                'date_of_birth'            => '2002-07-22',
                'passport_status'          => 'processing',
                'gpa'                      => 3.20,
                'hsk_level'                => 'HSK3',
                'hskk_level'               => 'HSKK-beginner',
                'desired_scholarship_type' => 'CIS',
                'notes'                    => 'Đang làm hộ chiếu mới, dự kiến hoàn thành 15/03/2026.',
                'created_at'               => now(),
                'updated_at'               => now(),
            ],
            [
                'user_id'                  => $student3->id,
                'phone'                    => '0923456789',
                'date_of_birth'            => '2000-11-08',
                'passport_status'          => 'valid',
                'gpa'                      => 3.80,
                'hsk_level'                => 'HSK5',
                'hskk_level'               => 'HSKK-advanced',
                'desired_scholarship_type' => 'self-funded',
                'notes'                    => 'Hộ chiếu còn hạn đến 2028. Sinh viên xuất sắc, ưu tiên trường top 50.',
                'created_at'               => now(),
                'updated_at'               => now(),
            ],
        ];

        foreach ($profiles as $profile) {
            DB::table('student_profiles')->updateOrInsert(
                ['user_id' => $profile['user_id']],
                $profile
            );
        }

        $this->command->info('✓ StudentProfiles seeded: 3 records');
    }
}
