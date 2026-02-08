<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application with demo accounts for all roles.
     */
    public function run(): void
    {
        // ========================================
        // Admin User
        // ========================================
        User::updateOrCreate(
            ['email' => 'admin@vimiss.vn'],
            [
                'name' => 'Quản trị viên',
                'password' => 'password',
                'role' => 'admin',
                'status' => 'active',
                'must_change_password' => false,
            ]
        );

        // ========================================
        // Director User
        // ========================================
        User::updateOrCreate(
            ['email' => 'director@vimiss.vn'],
            [
                'name' => 'Nguyễn Văn Giám Đốc',
                'password' => 'password',
                'role' => 'director',
                'status' => 'active',
                'must_change_password' => false,
            ]
        );

        // ========================================
        // Mentor Users
        // ========================================
        User::updateOrCreate(
            ['email' => 'mentor1@vimiss.vn'],
            [
                'name' => 'Trần Thị Mentor A',
                'password' => 'password',
                'role' => 'mentor',
                'status' => 'active',
                'must_change_password' => false,
            ]
        );

        User::updateOrCreate(
            ['email' => 'mentor2@vimiss.vn'],
            [
                'name' => 'Lê Văn Mentor B',
                'password' => 'password',
                'role' => 'mentor',
                'status' => 'active',
                'must_change_password' => false,
            ]
        );

        // ========================================
        // Student Users
        // ========================================
        User::updateOrCreate(
            ['email' => 'student1@vimiss.vn'],
            [
                'name' => 'Phạm Văn Sinh Viên A',
                'password' => 'password',
                'role' => 'student',
                'status' => 'active',
                'must_change_password' => false,
            ]
        );

        User::updateOrCreate(
            ['email' => 'student2@vimiss.vn'],
            [
                'name' => 'Hoàng Thị Sinh Viên B',
                'password' => 'password',
                'role' => 'student',
                'status' => 'active',
                'must_change_password' => false,
            ]
        );

        User::updateOrCreate(
            ['email' => 'student3@vimiss.vn'],
            [
                'name' => 'Đỗ Văn Sinh Viên C',
                'password' => 'password',
                'role' => 'student',
                'status' => 'active',
                'must_change_password' => false,
            ]
        );

        $this->command->info('Seeded demo accounts:');
        $this->command->table(
            ['Email', 'Role', 'Password'],
            [
                ['admin@vimiss.vn', 'admin', 'password'],
                ['director@vimiss.vn', 'director', 'password'],
                ['mentor1@vimiss.vn', 'mentor', 'password'],
                ['mentor2@vimiss.vn', 'mentor', 'password'],
                ['student1@vimiss.vn', 'student', 'password'],
                ['student2@vimiss.vn', 'student', 'password'],
                ['student3@vimiss.vn', 'student', 'password'],
            ]
        );
    }
}
