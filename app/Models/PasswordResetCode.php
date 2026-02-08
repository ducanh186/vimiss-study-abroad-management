<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PasswordResetCode extends Model
{
    protected $fillable = [
        'email',
        'code_hash',
        'expires_at',
        'used_at',
        'resend_available_at',
        'last_sent_at',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'used_at' => 'datetime',
            'resend_available_at' => 'datetime',
            'last_sent_at' => 'datetime',
        ];
    }

    public function isExpired(): bool
    {
        return $this->expires_at->isPast();
    }

    public function isUsed(): bool
    {
        return $this->used_at !== null;
    }

    public function canResend(): bool
    {
        return $this->resend_available_at === null || $this->resend_available_at->isPast();
    }

    public function verifyCode(string $code): bool
    {
        return hash_equals($this->code_hash, hash('sha256', $code));
    }

    public function markAsUsed(): void
    {
        $this->update(['used_at' => now()]);
    }

    public static function getLatestValidCode(string $email): ?self
    {
        return static::where('email', $email)
            ->whereNull('used_at')
            ->where('expires_at', '>', now())
            ->orderBy('created_at', 'desc')
            ->first();
    }

    public static function invalidatePreviousCodes(string $email): void
    {
        static::where('email', $email)
            ->whereNull('used_at')
            ->update(['used_at' => now()]);
    }
}
