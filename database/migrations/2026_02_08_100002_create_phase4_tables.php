<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Applications
        Schema::create('applications', function (Blueprint $table) {
            $table->id();
            $table->foreignId('student_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('mentor_id')->constrained('users')->cascadeOnDelete();
            $table->foreignId('created_by')->constrained('users');
            $table->enum('status', [
                'draft',
                'in_progress',
                'documents_pending',
                'documents_reviewing',
                'submitted_to_university',
                'accepted',
                'rejected',
                'on_hold_needs_mentor',
                'cancelled',
            ])->default('draft');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['student_id', 'status']);
            $table->index(['mentor_id', 'status']);
        });

        // Application histories (audit log for application changes)
        Schema::create('application_histories', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('applications')->cascadeOnDelete();
            $table->foreignId('changed_by')->constrained('users');
            $table->string('field_changed', 50);
            $table->string('old_value')->nullable();
            $table->string('new_value')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['application_id', 'created_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('application_histories');
        Schema::dropIfExists('applications');
    }
};
