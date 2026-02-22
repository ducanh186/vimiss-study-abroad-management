<?php

namespace App\Services;

use App\Mail\VerificationCodeMail;
use App\Models\AuditLog;
use App\Models\User;
use App\Models\VerificationCode;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class AuthService
{
    public const CODE_TTL_MINUTES = 5;
    public const RESEND_COOLDOWN_SECONDS = 60;
    public const CODE_LENGTH = 6;

    // =========================================================================
    // Register flow
    // =========================================================================

    public function requestRegisterCode(string $email, string $name, string $ip): array
    {
        if (User::where('email', $email)->exists()) {
            Log::info('Register code requested for existing email', ['email' => $email]);
            return [
                'success' => true,
                'message' => 'Nếu email hợp lệ, mã xác thực đã được gửi đến hộp thư của bạn.',
            ];
        }

        $existingCode = VerificationCode::getLatestValidCode($email, VerificationCode::PURPOSE_REGISTER);

        if ($existingCode && !$existingCode->canResend()) {
            Log::info('Register code requested but cooldown not passed', ['email' => $email]);
            return [
                'success' => true,
                'message' => 'Nếu email hợp lệ, mã xác thực đã được gửi đến hộp thư của bạn.',
            ];
        }

        VerificationCode::invalidatePreviousCodes($email, VerificationCode::PURPOSE_REGISTER);

        $plainCode = $this->generateCode();

        VerificationCode::create([
            'email' => $email,
            'purpose' => VerificationCode::PURPOSE_REGISTER,
            'code_hash' => hash('sha256', $plainCode),
            'expires_at' => now()->addMinutes(self::CODE_TTL_MINUTES),
            'resend_available_at' => now()->addSeconds(self::RESEND_COOLDOWN_SECONDS),
            'request_ip' => $ip,
        ]);

        $this->sendCode($email, $plainCode, 'register');

        AuditLog::logEvent('register_code_requested', $email, $ip, null, ['name' => $name]);

        return [
            'success' => true,
            'message' => 'Nếu email hợp lệ, mã xác thực đã được gửi đến hộp thư của bạn.',
        ];
    }

    public function register(string $email, string $name, string $code, string $password, string $ip): array
    {
        if (User::where('email', $email)->exists()) {
            return [
                'success' => false,
                'error' => 'email',
                'message' => 'Email đã được đăng ký.',
            ];
        }

        $verificationCode = VerificationCode::getLatestValidCode($email, VerificationCode::PURPOSE_REGISTER);

        if (!$verificationCode) {
            return [
                'success' => false,
                'error' => 'verification_code',
                'message' => 'Mã xác thực không hợp lệ hoặc đã hết hạn.',
            ];
        }

        $verificationCode->incrementAttempts();

        if ($verificationCode->isExpired() || $verificationCode->isConsumed()) {
            return [
                'success' => false,
                'error' => 'verification_code',
                'message' => 'Mã xác thực đã hết hạn.',
            ];
        }

        if (!$verificationCode->verifyCode($code)) {
            Log::info('Register failed - invalid code', ['email' => $email]);
            return [
                'success' => false,
                'error' => 'verification_code',
                'message' => 'Mã xác thực không chính xác.',
            ];
        }

        $verificationCode->markAsConsumed();

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => $password,
            'role' => User::ROLE_STUDENT,
            'status' => 'active',
            'must_change_password' => false,
        ]);

        AuditLog::logEvent('user_registered', $email, $ip, $user->id, ['role' => User::ROLE_STUDENT]);

        Log::info('Student registered successfully', ['email' => $email, 'user_id' => $user->id]);

        return [
            'success' => true,
            'message' => 'Đăng ký thành công!',
            'user' => $user,
        ];
    }

    // =========================================================================
    // Password reset flow
    // =========================================================================

    public function requestPasswordResetCode(string $email, string $ip = null): array
    {
        $user = User::where('email', $email)->first();

        if (!$user) {
            Log::info('Password reset requested for non-existent email', ['email' => $email]);
            return [
                'success' => true,
                'message' => "If the email is registered, we've sent a verification code to your inbox.",
            ];
        }

        $existingCode = VerificationCode::getLatestValidCode($email, VerificationCode::PURPOSE_PASSWORD_RESET);

        if ($existingCode && !$existingCode->canResend()) {
            Log::info('Password reset requested but cooldown not passed', ['email' => $email]);
            return [
                'success' => true,
                'message' => "If the email is registered, we've sent a verification code to your inbox.",
            ];
        }

        VerificationCode::invalidatePreviousCodes($email, VerificationCode::PURPOSE_PASSWORD_RESET);

        $plainCode = $this->generateCode();

        VerificationCode::create([
            'email' => $email,
            'user_id' => $user->id,
            'purpose' => VerificationCode::PURPOSE_PASSWORD_RESET,
            'code_hash' => hash('sha256', $plainCode),
            'expires_at' => now()->addMinutes(self::CODE_TTL_MINUTES),
            'resend_available_at' => now()->addSeconds(self::RESEND_COOLDOWN_SECONDS),
            'request_ip' => $ip,
        ]);

        $this->sendCode($email, $plainCode, 'password_reset');

        AuditLog::logEvent('password_reset_code_requested', $email, $ip, $user->id);

        return [
            'success' => true,
            'message' => "If the email is registered, we've sent a verification code to your inbox.",
        ];
    }

    public function resetPassword(string $email, string $code, string $newPassword, string $ip = null): array
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

        $resetCode = VerificationCode::getLatestValidCode($email, VerificationCode::PURPOSE_PASSWORD_RESET);

        if (!$resetCode) {
            return [
                'success' => false,
                'error' => 'verification_code',
                'message' => 'The verification code is incorrect!',
            ];
        }

        $resetCode->incrementAttempts();

        if ($resetCode->isExpired() || $resetCode->isConsumed() || !$resetCode->verifyCode($code)) {
            Log::info('Password reset failed - invalid/expired/used code', ['email' => $email]);
            return [
                'success' => false,
                'error' => 'verification_code',
                'message' => 'The verification code is incorrect!',
            ];
        }

        $resetCode->markAsConsumed();

        $user->update([
            'password' => $newPassword,
        ]);

        $user->tokens()->delete();

        AuditLog::logEvent('password_reset_completed', $email, $ip, $user->id);

        Log::info('Password reset successful', ['email' => $email]);

        return [
            'success' => true,
            'message' => 'Password reset successfully.',
        ];
    }

    // =========================================================================
    // Change password
    // =========================================================================

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

        AuditLog::logEvent('password_changed', $user->email, null, $user->id);

        Log::info('Password changed successfully', ['user_id' => $user->id]);

        return [
            'success' => true,
            'message' => 'Password changed successfully.',
        ];
    }

    // =========================================================================
    // Helpers
    // =========================================================================

    protected function generateCode(): string
    {
        return str_pad((string) random_int(0, 999999), self::CODE_LENGTH, '0', STR_PAD_LEFT);
    }

    protected function sendCode(string $email, string $code, string $purpose): void
    {
        Log::info('Verification code generated', [
            'email' => $email,
            'code' => app()->environment('local') ? $code : '[REDACTED]',
            'purpose' => $purpose,
        ]);

        try {
            Mail::to($email)->send(new VerificationCodeMail($code, $purpose, self::CODE_TTL_MINUTES));
        } catch (\Exception $e) {
            Log::error('Failed to send verification code email', [
                'email' => $email,
                'purpose' => $purpose,
                'error' => $e->getMessage(),
            ]);
        }
    }
}
