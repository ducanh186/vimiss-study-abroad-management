<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Alter mentor_profiles: add staff_code, is_active, rename max_students → capacity_max
        Schema::table('mentor_profiles', function (Blueprint $table) {
            $table->string('staff_code', 10)->unique()->after('user_id');
            $table->boolean('is_active')->default(true)->after('bio');
            $table->renameColumn('max_students', 'capacity_max');
        });

        // Change specialty from enum to string to support flexible values
        Schema::table('mentor_profiles', function (Blueprint $table) {
            $table->string('specialty', 50)->default('general')->change();
        });

        // Student profiles
        Schema::create('student_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->string('phone', 20)->nullable();
            $table->date('date_of_birth')->nullable();
            $table->string('passport_status', 30)->default('none'); // none, valid, expired, processing
            $table->decimal('gpa', 4, 2)->nullable();
            $table->string('hsk_level', 10)->nullable();  // HSK1-6
            $table->string('hskk_level', 10)->nullable(); // HSKK beginner/intermediate/advanced
            $table->string('desired_scholarship_type', 30)->nullable(); // CSC, CIS, self-funded
            $table->text('notes')->nullable();
            $table->timestamps();
        });

        // Mentor-Student assignments
        Schema::create('mentor_student_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('mentor_id')->constrained('users')->cascadeOnDelete();
            $table->timestamp('assigned_at');
            $table->string('assigned_by', 20); // student, admin, system
            $table->timestamp('unassigned_at')->nullable();
            $table->string('unassign_reason')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'unassigned_at']);
            $table->index(['mentor_id', 'unassigned_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('mentor_student_assignments');
        Schema::dropIfExists('student_profiles');

        Schema::table('mentor_profiles', function (Blueprint $table) {
            $table->dropColumn(['staff_code', 'is_active']);
            $table->renameColumn('capacity_max', 'max_students');
        });
    }
};
