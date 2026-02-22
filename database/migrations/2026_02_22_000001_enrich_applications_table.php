<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * PR1 — Enrich applications table with business fields
 *       and upgrade status enum to 13-state pipeline.
 *
 * Covers:
 *  - Add application_type, scholarship_type, university_id, major, intake_term
 *  - Widen status enum to 12 values (13-state pipeline per D-01)
 *  - Add reviewer to users.role enum (per D-02 Option A)
 *  - Add province/university to scholarships.type enum
 *  - Map existing seeded statuses to new pipeline equivalents
 */
return new class extends Migration
{
    public function up(): void
    {
        // ------------------------------------------------------------------
        // 1. Add new columns to applications
        // ------------------------------------------------------------------
        Schema::table('applications', function (Blueprint $table) {
            $table->string('application_type', 30)->default('master')->after('status');
            $table->string('scholarship_type', 30)->nullable()->after('application_type');
            $table->foreignId('university_id')->nullable()->after('scholarship_type')
                  ->constrained('universities')->nullOnDelete();
            $table->string('major', 200)->nullable()->after('university_id');
            $table->string('intake_term', 20)->nullable()->after('major');
        });

        // ------------------------------------------------------------------
        // 2. Widen status column to VARCHAR (replacing restrictive enum)
        //    SQLite doesn't support ALTER COLUMN, and Laravel's enum change
        //    is fragile. Using a VARCHAR + CHECK in app layer is safer for
        //    cross-DB compatibility (MySQL dev + SQLite test).
        // ------------------------------------------------------------------
        // For MySQL: convert enum → varchar(30)
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE applications MODIFY COLUMN status VARCHAR(30) NOT NULL DEFAULT 'draft'");
        }
        // For SQLite: column is already TEXT-compatible, no action needed.

        // ------------------------------------------------------------------
        // 3. Map old statuses → new pipeline equivalents
        // ------------------------------------------------------------------
        $statusMap = [
            'in_progress'          => 'collecting_docs',
            'documents_pending'    => 'collecting_docs',
            'documents_reviewing'  => 'ready_for_review',
            'submitted_to_university' => 'submitted',
            'accepted'             => 'admitted',
            'on_hold_needs_mentor' => 'draft',
        ];

        foreach ($statusMap as $old => $new) {
            DB::table('applications')->where('status', $old)->update(['status' => $new]);
        }

        // ------------------------------------------------------------------
        // 4. Add 'reviewer' to users.role enum
        // ------------------------------------------------------------------
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','director','reviewer','mentor','student') NOT NULL DEFAULT 'student'");
        } else {
            // SQLite: Laravel implements enum() as TEXT + CHECK constraint.
            // Convert to plain string to remove the restrictive CHECK.
            Schema::table('users', function (Blueprint $table) {
                $table->string('role', 30)->default('student')->change();
            });
        }

        // ------------------------------------------------------------------
        // 5. Widen scholarships.type to support new values
        // ------------------------------------------------------------------
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE scholarships MODIFY COLUMN type VARCHAR(30) NOT NULL DEFAULT 'CSC'");
        } else {
            // SQLite: convert enum to plain string to remove CHECK constraint
            Schema::table('scholarships', function (Blueprint $table) {
                $table->string('type', 30)->default('CSC')->change();
            });
        }
    }

    public function down(): void
    {
        // Reverse status mapping
        $reverseMap = [
            'collecting_docs'  => 'in_progress',
            'ready_for_review' => 'documents_reviewing',
            'submitted'        => 'submitted_to_university',
            'admitted'         => 'accepted',
        ];

        foreach ($reverseMap as $new => $old) {
            DB::table('applications')->where('status', $new)->update(['status' => $old]);
        }

        // Drop new application columns
        Schema::table('applications', function (Blueprint $table) {
            $table->dropForeign(['university_id']);
            $table->dropColumn(['application_type', 'scholarship_type', 'university_id', 'major', 'intake_term']);
        });

        // Revert status column to original enum (MySQL only)
        if (DB::getDriverName() === 'mysql') {
            DB::statement("ALTER TABLE applications MODIFY COLUMN status ENUM('draft','in_progress','documents_pending','documents_reviewing','submitted_to_university','accepted','rejected','on_hold_needs_mentor','cancelled') NOT NULL DEFAULT 'draft'");
            DB::statement("ALTER TABLE users MODIFY COLUMN role ENUM('admin','director','mentor','student') NOT NULL DEFAULT 'student'");
        }
    }
};
