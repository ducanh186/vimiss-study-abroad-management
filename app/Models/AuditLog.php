<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditLog extends Model
{
    protected $fillable = [
        'user_id',
        'event',
        'email',
        'ip_address',
        'metadata',
    ];

    protected function casts(): array
    {
        return [
            'metadata' => 'array',
        ];
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Log an audit event.
     */
    public static function logEvent(string $event, ?string $email = null, ?string $ip = null, ?int $userId = null, array $meta = []): self
    {
        return static::create([
            'user_id' => $userId,
            'event' => $event,
            'email' => $email,
            'ip_address' => $ip,
            'metadata' => !empty($meta) ? $meta : null,
        ]);
    }
}
