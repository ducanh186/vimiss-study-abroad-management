<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VerificationCode extends Model
{
    protected $fillable = [
        'email',
        'user_id',
        'purpose',
        'code_hash',
        'expires_at',
        'consumed_at',
        'resend_available_at',
        'request_ip',
        'attempts_count',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'consumed_at' => 'datetime',
            'resend_available_at' => 'datetime',
        ];
    }

    public const PURPOSE_REGISTER = 'register';
    public const PURPOSE_PASSWORD_RESET = 'password_reset';

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isConsumed(): bool
    {
        return $this->consumed_at !== null;
    }

    public function canResend(): bool
    {
        return $this->resend_available_at === null || $this->resend_available_at->isPast();
    }

    public function verifyCode(string $code): bool
    {
        return hash_equals($this->code_hash, hash('sha256', $code));
    }

    public function markAsConsumed(): void
    {
        $this->update(['consumed_at' => now()]);
    }

    public function incrementAttempts(): void
    {
        $this->increment('attempts_count');
    }

    public static function getLatestValidCode(string $email, string $purpose): ?self
    {
        return static::where('email', $email)
            ->where('purpose', $purpose)
            ->whereNull('consumed_at')
            ->where('expires_at', '>', now())
            ->orderBy('created_at', 'desc')
            ->first();
    }

    public static function invalidatePreviousCodes(string $email, string $purpose): void
    {
        static::where('email', $email)
            ->where('purpose', $purpose)
            ->whereNull('consumed_at')
            ->update(['consumed_at' => now()]);
    }
}
