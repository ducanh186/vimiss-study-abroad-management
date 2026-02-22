<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Scholarship extends Model
{
    protected $fillable = [
        'university_id',
        'name',
        'type',
        'min_hsk_level',
        'min_gpa',
        'deadline',
        'quota',
        'used_quota',
        'requirements',
        'description',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'deadline' => 'date',
            'min_gpa' => 'decimal:2',
            'is_active' => 'boolean',
        ];
    }

    public function university(): BelongsTo
    {
        return $this->belongsTo(University::class);
    }

    public function requests(): HasMany
    {
        return $this->hasMany(ScholarshipRequest::class);
    }

    /**
     * Check if the scholarship deadline has passed
     */
    public function isExpired(): bool
    {
        return $this->deadline && $this->deadline->isPast();
    }

    /**
     * Check if quota is full
     */
    public function isQuotaFull(): bool
    {
        return $this->quota && $this->used_quota >= $this->quota;
    }
}
