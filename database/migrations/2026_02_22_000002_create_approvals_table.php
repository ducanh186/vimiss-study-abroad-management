<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * PR2 — Create approvals table.
 *
 * Records each step-1 and step-2 approval/rejection action
 * taken on an application in the review pipeline.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('approvals', function (Blueprint $table) {
            $table->id();

            $table->foreignId('application_id')
                  ->constrained('applications')
                  ->cascadeOnDelete();

            $table->foreignId('actor_id')
                  ->comment('User who performed the approval action')
                  ->constrained('users');

            $table->tinyInteger('step')
                  ->comment('1 = reviewer step, 2 = director step');

            $table->string('action', 20)
                  ->comment('approved | rejected');

            $table->text('notes')->nullable();

            $table->timestamps();

            $table->index(['application_id', 'step']);
            $table->index('actor_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('approvals');
    }
};
