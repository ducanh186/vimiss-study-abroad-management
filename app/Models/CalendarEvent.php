<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CalendarEvent extends Model
{
    protected $fillable = [
        'created_by',
        'title',
        'description',
        'start_date',
        'end_date',
        'type',
        'visibility',
    ];

    protected function casts(): array
    {
        return [
            'start_date' => 'datetime',
            'end_date' => 'datetime',
        ];
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    /**
     * Scope to filter by visibility for a given role
     */
    public function scopeVisibleTo($query, string $role)
    {
        return $query->where(function ($q) use ($role) {
            $q->where('visibility', 'all')
              ->orWhere('visibility', $role);
        });
    }
}
