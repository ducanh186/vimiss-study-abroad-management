<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('application_documents', function (Blueprint $table) {
            $table->string('storage', 20)->default('drive')->after('file_path');
            $table->string('drive_file_id')->nullable()->after('storage');
            $table->string('drive_folder_id')->nullable()->after('drive_file_id');
            $table->string('checksum', 64)->nullable()->after('drive_folder_id');
            $table->foreignId('reviewed_by')->nullable()->after('notes');
            $table->timestamp('reviewed_at')->nullable()->after('reviewed_by');
        });

        // SQLite stores enums with a CHECK constraint.
        // We must rebuild the table to add 'rejected' to the allowed values.
        if (DB::getDriverName() === 'sqlite') {
            // 1. Rename the old column
            DB::statement('ALTER TABLE application_documents RENAME COLUMN label_status TO label_status_old');

            // 2. Add new column with updated CHECK constraint
            DB::statement("ALTER TABLE application_documents ADD COLUMN label_status VARCHAR(255) NOT NULL DEFAULT 'pending_review' CHECK (label_status IN ('pending_review','valid','need_more','translating','submitted','rejected'))");

            // 3. Copy data
            DB::statement('UPDATE application_documents SET label_status = label_status_old');

            // 4. Drop old column
            DB::statement('ALTER TABLE application_documents DROP COLUMN label_status_old');
        } else {
            // MySQL: modify enum in place
            DB::statement("ALTER TABLE application_documents MODIFY label_status ENUM('pending_review','valid','need_more','translating','submitted','rejected') NOT NULL DEFAULT 'pending_review'");
        }
    }

    public function down(): void
    {
        Schema::table('application_documents', function (Blueprint $table) {
            $table->dropColumn([
                'storage',
                'drive_file_id',
                'drive_folder_id',
                'checksum',
                'reviewed_by',
                'reviewed_at',
            ]);
        });
    }
};
