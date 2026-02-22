<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
class Application extends Model
{
    // ── Status constants (13-state pipeline per D-01) ───────────
    public const STATUS_DRAFT = 'draft';
    public const STATUS_COLLECTING_DOCS = 'collecting_docs';
    public const STATUS_READY_FOR_REVIEW = 'ready_for_review';
    public const STATUS_REVIEW_STEP_1 = 'review_step_1';
    public const STATUS_REVIEW_STEP_2 = 'review_step_2';
    public const STATUS_APPROVED = 'approved';
    public const STATUS_SUBMITTED = 'submitted';
    public const STATUS_INTERVIEW = 'interview';
    public const STATUS_ADMITTED = 'admitted';
    public const STATUS_REJECTED = 'rejected';
    public const STATUS_DEFERRED = 'deferred';
    public const STATUS_CANCELLED = 'cancelled';

    public const STATUSES = [
        self::STATUS_DRAFT,
        self::STATUS_COLLECTING_DOCS,
        self::STATUS_READY_FOR_REVIEW,
        self::STATUS_REVIEW_STEP_1,
        self::STATUS_REVIEW_STEP_2,
        self::STATUS_APPROVED,
        self::STATUS_SUBMITTED,
        self::STATUS_INTERVIEW,
        self::STATUS_ADMITTED,
        self::STATUS_REJECTED,
        self::STATUS_DEFERRED,
        self::STATUS_CANCELLED,
    ];

    // ── Allowed status transitions (state machine) ──────────────
    public const ALLOWED_TRANSITIONS = [
        self::STATUS_DRAFT            => [self::STATUS_COLLECTING_DOCS, self::STATUS_CANCELLED],
        self::STATUS_COLLECTING_DOCS  => [self::STATUS_READY_FOR_REVIEW, self::STATUS_DRAFT, self::STATUS_CANCELLED],
        self::STATUS_READY_FOR_REVIEW => [self::STATUS_REVIEW_STEP_1, self::STATUS_COLLECTING_DOCS, self::STATUS_CANCELLED],
        self::STATUS_REVIEW_STEP_1    => [self::STATUS_REVIEW_STEP_2, self::STATUS_COLLECTING_DOCS, self::STATUS_CANCELLED],
        self::STATUS_REVIEW_STEP_2    => [self::STATUS_APPROVED, self::STATUS_COLLECTING_DOCS, self::STATUS_CANCELLED],
        self::STATUS_APPROVED         => [self::STATUS_SUBMITTED, self::STATUS_CANCELLED],
        self::STATUS_SUBMITTED        => [self::STATUS_INTERVIEW, self::STATUS_ADMITTED, self::STATUS_REJECTED, self::STATUS_DEFERRED, self::STATUS_CANCELLED],
        self::STATUS_INTERVIEW        => [self::STATUS_ADMITTED, self::STATUS_REJECTED, self::STATUS_DEFERRED, self::STATUS_CANCELLED],
        self::STATUS_ADMITTED         => [], // terminal
        self::STATUS_REJECTED         => [self::STATUS_DRAFT],
        self::STATUS_DEFERRED         => [self::STATUS_DRAFT],
        self::STATUS_CANCELLED        => [], // terminal
    ];

    // ── Application types (per D-05) ────────────────────────────
    public const TYPE_MASTER = 'master';
    public const TYPE_ENGINEER = 'engineer';
    public const TYPE_BACHELOR = 'bachelor';
    public const TYPE_UNDERGRADUATE = 'undergraduate';
    public const TYPE_LANGUAGE = 'language';
    public const TYPE_OTHER = 'other';

    public const APPLICATION_TYPES = [
        self::TYPE_MASTER,
        self::TYPE_ENGINEER,
        self::TYPE_BACHELOR,
        self::TYPE_UNDERGRADUATE,
        self::TYPE_LANGUAGE,
        self::TYPE_OTHER,
    ];

    // ── Scholarship types (per D-05) ────────────────────────────
    public const SCHOLARSHIP_CSC = 'CSC';
    public const SCHOLARSHIP_CIS = 'CIS';
    public const SCHOLARSHIP_PROVINCE = 'province';
    public const SCHOLARSHIP_UNIVERSITY = 'university';
    public const SCHOLARSHIP_SELF_FUNDED = 'self_funded';
    public const SCHOLARSHIP_OTHER = 'other';

    public const SCHOLARSHIP_TYPES = [
        self::SCHOLARSHIP_CSC,
        self::SCHOLARSHIP_CIS,
        self::SCHOLARSHIP_PROVINCE,
        self::SCHOLARSHIP_UNIVERSITY,
        self::SCHOLARSHIP_SELF_FUNDED,
        self::SCHOLARSHIP_OTHER,
    ];

    protected $fillable = [
        'student_id',
        'mentor_id',
        'created_by',
        'status',
        'application_type',
        'scholarship_type',
        'university_id',
        'major',
        'intake_term',
        'notes',
    ];

    // ── State machine ───────────────────────────────────────────

    /**
     * Check if the application can transition to the given status.
     */
    public function canTransitionTo(string $newStatus): bool
    {
        $allowed = self::ALLOWED_TRANSITIONS[$this->status] ?? [];

        return in_array($newStatus, $allowed, true);
    }

    // ── Relationships ───────────────────────────────────────────

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function mentor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mentor_id');
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function university(): BelongsTo
    {
        return $this->belongsTo(University::class);
    }

    public function histories(): HasMany
    {
        return $this->hasMany(ApplicationHistory::class)->orderByDesc('created_at');
    }

    public function documents(): HasMany
    {
        return $this->hasMany(ApplicationDocument::class);
    }

    public function scholarshipRequests(): HasMany
    {
        return $this->hasMany(ScholarshipRequest::class);
    }

    public function reviewRequests(): HasMany
    {
        return $this->hasMany(ReviewRequest::class);
    }

    public function approvals(): HasMany
    {
        return $this->hasMany(Approval::class)->orderByDesc('created_at');
    }

    /**
     * Log a change to application history.
     */
    public function logChange(int $changedBy, string $field, ?string $oldValue, ?string $newValue, ?string $notes = null): ApplicationHistory
    {
        return $this->histories()->create([
            'changed_by' => $changedBy,
            'field_changed' => $field,
            'old_value' => $oldValue,
            'new_value' => $newValue,
            'notes' => $notes,
        ]);
    }
}
