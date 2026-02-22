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
        // Reviewer User
        // ========================================
        User::updateOrCreate(
            ['email' => 'reviewer@vimiss.vn'],
            [
                'name' => 'Vũ Thị Reviewer',
                'password' => 'password',
                'role' => 'reviewer',
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

        // Mark all demo accounts as email-verified
        User::whereNull('email_verified_at')
            ->whereIn('email', [
                'admin@vimiss.vn', 'director@vimiss.vn', 'reviewer@vimiss.vn',
                'mentor1@vimiss.vn', 'mentor2@vimiss.vn',
                'student1@vimiss.vn', 'student2@vimiss.vn', 'student3@vimiss.vn',
            ])
            ->update(['email_verified_at' => now()]);

        $this->command->info('Seeded demo accounts:');
        $this->command->table(
            ['Email', 'Role', 'Password'],
            [
                ['admin@vimiss.vn', 'admin', 'password'],
                ['director@vimiss.vn', 'director', 'password'],
                ['reviewer@vimiss.vn', 'reviewer', 'password'],
                ['mentor1@vimiss.vn', 'mentor', 'password'],
                ['mentor2@vimiss.vn', 'mentor', 'password'],
                ['student1@vimiss.vn', 'student', 'password'],
                ['student2@vimiss.vn', 'student', 'password'],
                ['student3@vimiss.vn', 'student', 'password'],
            ]
        );

        // ========================================
        // MVP Seed Data
        // ========================================
        $this->command->info('');
        $this->command->info('Running MVP seed data...');

        $this->call([
            MentorProfileSeeder::class,
            StudentProfileSeeder::class,
            UniversityScholarshipSeeder::class,
            ApplicationSeeder::class,          // also seeds: mentor_student_assignments, scholarship_requests
            ApplicationDocumentSeeder::class,
            ReviewRequestSeeder::class,
            ApplicationHistorySeeder::class,
            CalendarEventSeeder::class,
            QaFeedbackSeeder::class,
        ]);

        $this->command->info('');
        $this->command->info('✅ MVP seed complete. Summary:');
        $this->command->table(
            ['Table', 'Records'],
            [
                ['mentor_profiles',            '2'],
                ['student_profiles',           '3'],
                ['universities',               '5'],
                ['scholarships',               '9 (2 EXPIRED)'],
                ['mentor_student_assignments', '4 (3 active + 1 historical)'],
                ['applications',               '8'],
                ['scholarship_requests',       '6'],
                ['application_documents',      '~40 (6–8 per app)'],
                ['review_requests',            '3'],
                ['application_histories',      '~36 (4–7 per app)'],
                ['calendar_events',            '8'],
                ['notifications (Q&A+FB)',     '8 (5 Q&A + 3 feedback)'],
            ]
        );
    }
}
