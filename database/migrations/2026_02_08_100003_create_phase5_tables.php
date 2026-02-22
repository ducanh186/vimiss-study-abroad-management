<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Application documents
        Schema::create('application_documents', function (Blueprint $table) {
            $table->id();
            $table->foreignId('application_id')->constrained('applications')->cascadeOnDelete();
            $table->foreignId('uploaded_by')->constrained('users');
            $table->string('file_path');
            $table->string('original_name');
            $table->string('mime_type', 100);
            $table->unsignedBigInteger('file_size');
            $table->string('type', 50); // passport, transcript, hsk_cert, recommendation, personal_statement, other
            $table->enum('label_status', [
                'pending_review',
                'valid',
                'need_more',
                'translating',
                'submitted',
            ])->default('pending_review');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index(['application_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('application_documents');
    }
};
