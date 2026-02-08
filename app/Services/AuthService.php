<?php

namespace App\Services;

use App\Models\PasswordResetCode;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;

class AuthService
{
    public const CODE_TTL_MINUTES = 5;
    public const RESEND_COOLDOWN_MINUTES = 1;
    public const CODE_LENGTH = 6;

    /**
     * Request a password reset code.
     * Always returns success to prevent email enumeration.
     */
    public function requestPasswordResetCode(string $email): array
    {
        $user = User::where('email', $email)->first();

        if (!$user) {
            Log::info('Password reset requested for non-existent email', ['email' => $email]);
            return [
                'success' => true,
                'message' => "If the email is registered, we've sent a verification code to your inbox.",
            ];
        }

        $existingCode = PasswordResetCode::getLatestValidCode($email);

        if ($existingCode && !$existingCode->canResend()) {
            Log::info('Password reset requested but cooldown not passed', ['email' => $email]);
            return [
                'success' => true,
                'message' => "If the email is registered, we've sent a verification code to your inbox.",
            ];
        }

        PasswordResetCode::invalidatePreviousCodes($email);

        $plainCode = $this->generateCode();
        $codeHash = hash('sha256', $plainCode);

        PasswordResetCode::create([
            'email' => $email,
            'code_hash' => $codeHash,
            'expires_at' => now()->addMinutes(self::CODE_TTL_MINUTES),
            'resend_available_at' => now()->addMinutes(self::RESEND_COOLDOWN_MINUTES),
            'last_sent_at' => now(),
        ]);

        $this->sendResetCode($user, $plainCode);

        return [
            'success' => true,
            'message' => "If the email is registered, we've sent a verification code to your inbox.",
        ];
    }

    /**
     * Reset password using verification code.
     */
    public function resetPassword(string $email, string $code, string $newPassword): array
    {
        $user = User::where('email', $email)->first();

        if (!$user) {
            Log::info('Password reset attempted for non-existent email', ['email' => $email]);
            return [
                'success' => false,
                'error' => 'verification_code',
                'message' => 'The verification code is incorrect!',
            ];
        }

        $resetCode = PasswordResetCode::getLatestValidCode($email);

        if (!$resetCode || $resetCode->isExpired() || $resetCode->isUsed() || !$resetCode->verifyCode($code)) {
            Log::info('Password reset failed - invalid/expired/used code', ['email' => $email]);
            return [
                'success' => false,
                'error' => 'verification_code',
                'message' => 'The verification code is incorrect!',
            ];
        }

        $resetCode->markAsUsed();

        $user->update([
            'password' => $newPassword,
        ]);

        $user->tokens()->delete();

        Log::info('Password reset successful', ['email' => $email]);

        return [
            'success' => true,
            'message' => 'Password reset successfully.',
        ];
    }

    /**
     * Change password for authenticated user.
     */
    public function changePassword(User $user, string $currentPassword, string $newPassword): array
    {
        if (!Hash::check($currentPassword, $user->password)) {
            return [
                'success' => false,
                'error' => 'current_password',
                'message' => 'The current password is incorrect.',
            ];
        }

        $user->update([
            'password' => $newPassword,
            'must_change_password' => false,
        ]);

        Log::info('Password changed successfully', ['user_id' => $user->id]);

        return [
            'success' => true,
            'message' => 'Password changed successfully.',
        ];
    }

    protected function generateCode(): string
    {
        return str_pad((string) random_int(0, 999999), self::CODE_LENGTH, '0', STR_PAD_LEFT);
    }

    protected function sendResetCode(User $user, string $code): void
    {
        // In production, send actual email
        // Mail::to($user)->send(new PasswordResetCodeMail($code));
        Log::info('Password reset code generated', [
            'email' => $user->email,
            'code' => $code, // Only log in dev; remove in production
        ]);
    }
}
