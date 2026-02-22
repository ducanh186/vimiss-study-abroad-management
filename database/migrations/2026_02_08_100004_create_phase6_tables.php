<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Universities
        Schema::create('universities', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('country', 100);
            $table->string('city', 100)->nullable();
            $table->integer('ranking')->nullable();
            $table->text('programs')->nullable(); // JSON array of program names
            $table->text('description')->nullable();
            $table->string('website')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
        });

        // Scholarships
        Schema::create('scholarships', function (Blueprint $table) {
            $table->id();
            $table->foreignId('university_id')->constrained('universities')->cascadeOnDelete();
            $table->string('name');
            $table->enum('type', ['CSC', 'CIS', 'self-funded', 'other'])->default('CSC');
            $table->string('min_hsk_level', 10)->nullable();
            $table->decimal('min_gpa', 4, 2)->nullable();
            $table->date('deadline')->nullable();
            $table->unsignedInteger('quota')->nullable();
            $table->unsignedInteger('used_quota')->default(0);
            $table->text('requirements')->nullable();
            $table->text('description')->nullable();
            $table->boolean('is_active')->default(true);
            $table->timestamps();

            $table->index(['deadline', 'is_active']);
            $table->index('type');
        });

        // Scholarship requests (linked to application)
        Schema::create('scholarship_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('applications')->cascadeOnDelete();
            $table->foreignId('scholarship_id')->constrained('scholarships')->cascadeOnDelete();
            $table->foreignId('requested_by')->constrained('users');
            $table->enum('status', ['pending', 'approved', 'rejected', 'expired'])->default('pending');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['application_id', 'status']);
        });

        // Review requests (mentor submit → admin/director approve)
        Schema::create('review_requests', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('applications')->cascadeOnDelete();
            $table->foreignId('submitted_by')->constrained('users');
            $table->foreignId('reviewed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->enum('type', ['document_review', 'application_review', 'scholarship_approval'])->default('application_review');
            $table->enum('status', ['pending', 'approved', 'rejected'])->default('pending');
            $table->text('submit_notes')->nullable();
            $table->text('review_notes')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->timestamps();

            $table->index(['status', 'type']);
        });

        // Calendar events
        Schema::create('calendar_events', function (Blueprint $table) {
            $table->id();
            $table->foreignId('created_by')->constrained('users');
            $table->string('title');
            $table->text('description')->nullable();
            $table->dateTime('start_date');
            $table->dateTime('end_date')->nullable();
            $table->enum('type', ['deadline', 'meeting', 'reminder', 'other'])->default('other');
            $table->string('visibility', 20)->default('all'); // all, admin, mentor, student
            $table->timestamps();

            $table->index(['start_date', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('calendar_events');
        Schema::dropIfExists('review_requests');
        Schema::dropIfExists('scholarship_requests');
        Schema::dropIfExists('scholarships');
        Schema::dropIfExists('universities');
    }
};
