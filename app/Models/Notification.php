<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Notification extends Model
{
    use HasUuids;

    protected $fillable = [
        'user_id',
        'type',
        'data',
        'read_at',
    ];

    protected function casts(): array
    {
        return [
            'data' => 'array',
            'read_at' => 'datetime',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function scopeUnread($query)
    {
        return $query->whereNull('read_at');
    }

    /**
     * Create a notification for a user
     */
    public static function notify(int $userId, string $title, string $body, string $type = 'general'): self
    {
        return static::create([
            'user_id' => $userId,
            'type' => $type,
            'data' => ['title' => $title, 'body' => $body],
        ]);
    }

    /**
     * Accessor: get title from data
     */
    public function getTitleAttribute(): ?string
    {
        return $this->data['title'] ?? null;
    }

    /**
     * Accessor: get body from data
     */
    public function getBodyAttribute(): ?string
    {
        return $this->data['body'] ?? null;
    }
}
