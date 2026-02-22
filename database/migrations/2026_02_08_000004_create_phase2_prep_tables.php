<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Phase 2 preparation: mentor assignment schema for Phase 3.
 * - mentor_profiles: capacity, specialty
 * - notifications: in-app baseline
 */
return new class extends Migration
{
    public function up(): void
    {
        // Mentor profiles — capacity & specialty for Phase 3 assignment
        Schema::create('mentor_profiles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->unique()->constrained('users')->cascadeOnDelete();
            $table->unsignedSmallInteger('max_students')->default(5);
            $table->enum('specialty', ['CSC', 'CIS', 'self-funded', 'general'])->default('general');
            $table->text('bio')->nullable();
            $table->timestamps();
        });

        // In-app notifications baseline
        Schema::create('notifications', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('type');             // e.g. 'auth.register', 'auth.password_reset'
            $table->text('data');               // JSON payload
            $table->timestamp('read_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'read_at']);
        });

        // Security audit log
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('event');            // e.g. 'code_requested', 'code_consumed', 'login', 'register'
            $table->string('email')->nullable();
            $table->string('ip_address', 45)->nullable();
            $table->text('metadata')->nullable(); // JSON
            $table->timestamps();

            $table->index(['event', 'created_at']);
            $table->index('email');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('notifications');
        Schema::dropIfExists('mentor_profiles');
    }
};
