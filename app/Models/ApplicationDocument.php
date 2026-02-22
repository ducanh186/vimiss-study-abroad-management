<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApplicationDocument extends Model
{
    public const LABEL_PENDING = 'pending_review';
    public const LABEL_VALID = 'valid';
    public const LABEL_NEED_MORE = 'need_more';
    public const LABEL_TRANSLATING = 'translating';
    public const LABEL_SUBMITTED = 'submitted';
    public const LABEL_REJECTED = 'rejected';

    public const LABELS = [
        self::LABEL_PENDING,
        self::LABEL_VALID,
        self::LABEL_NEED_MORE,
        self::LABEL_TRANSLATING,
        self::LABEL_SUBMITTED,
        self::LABEL_REJECTED,
    ];

    public const STORAGE_LOCAL = 'local';
    public const STORAGE_DRIVE = 'drive';

    public const TYPES = [
        'passport',
        'transcript',
        'hsk_cert',
        'hskk_cert',
        'recommendation',
        'personal_statement',
        'photo',
        'medical_report',
        'other',
    ];

    protected $fillable = [
        'application_id',
        'uploaded_by',
        'file_path',
        'original_name',
        'mime_type',
        'file_size',
        'type',
        'label_status',
        'notes',
        'storage',
        'drive_file_id',
        'drive_folder_id',
        'checksum',
        'reviewed_by',
        'reviewed_at',
    ];

    protected function casts(): array
    {
        return [
            'reviewed_at' => 'datetime',
        ];
    }

    /**
     * Is this document stored on Google Drive?
     */
    public function isOnDrive(): bool
    {
        return $this->storage === self::STORAGE_DRIVE && $this->drive_file_id;
    }

    public function reviewer(): \Illuminate\Database\Eloquent\Relations\BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    public function application(): BelongsTo
    {
        return $this->belongsTo(Application::class);
    }

    public function uploader(): BelongsTo
    {
        return $this->belongsTo(User::class, 'uploaded_by');
    }
}
