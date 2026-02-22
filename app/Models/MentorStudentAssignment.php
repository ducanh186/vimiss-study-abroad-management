<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MentorStudentAssignment extends Model
{
    protected $fillable = [
        'student_id',
        'mentor_id',
        'assigned_at',
        'assigned_by',
        'unassigned_at',
        'unassign_reason',
    ];

    protected function casts(): array
    {
        return [
            'assigned_at' => 'datetime',
            'unassigned_at' => 'datetime',
        ];
    }

    public function student(): BelongsTo
    {
        return $this->belongsTo(User::class, 'student_id');
    }

    public function mentor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'mentor_id');
    }

    /**
     * Scope to only active assignments (not unassigned)
     */
    public function scopeActive($query)
    {
        return $query->whereNull('unassigned_at');
    }
}
