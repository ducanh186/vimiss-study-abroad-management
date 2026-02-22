<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class MentorProfileSeeder extends Seeder
{
    public function run(): void
    {
        $mentor1 = User::where('email', 'mentor1@vimiss.vn')->firstOrFail();
        $mentor2 = User::where('email', 'mentor2@vimiss.vn')->firstOrFail();

        $profiles = [
            [
                'user_id'      => $mentor1->id,
                'staff_code'   => 'VMS001',
                'capacity_max' => 5,
                'specialty'    => 'CSC',
                'bio'          => 'Chuyên gia tư vấn học bổng Chính phủ Trung Quốc (CSC). 5 năm kinh nghiệm hỗ trợ hồ sơ ngành Khoa học Máy tính và Kỹ thuật tại các trường top Trung Quốc.',
                'is_active'    => true,
                'created_at'   => now(),
                'updated_at'   => now(),
            ],
            [
                'user_id'      => $mentor2->id,
                'staff_code'   => 'VMS002',
                'capacity_max' => 5,
                'specialty'    => 'CIS',
                'bio'          => 'Chuyên tư vấn học bổng trao đổi văn hoá CIS và tự túc. Tốt nghiệp thạc sĩ tại Đại học Phúc Đán, am hiểu sâu quy trình nộp hồ sơ cho các trường miền Đông Trung Quốc.',
                'is_active'    => true,
                'created_at'   => now(),
                'updated_at'   => now(),
            ],
        ];

        foreach ($profiles as $profile) {
            DB::table('mentor_profiles')->updateOrInsert(
                ['user_id' => $profile['user_id']],
                $profile
            );
        }

        $this->command->info('✓ MentorProfiles seeded: 2 records');
    }
}
