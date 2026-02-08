<?php

namespace App\Http\Controllers;

use App\Http\Requests\ChangePasswordRequest;
use App\Http\Requests\ForgotPasswordRequest;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterRequest;
use App\Http\Requests\RegisterRequestCodeRequest;
use App\Http\Requests\ResetPasswordRequest;
use App\Models\AuditLog;
use App\Services\AuthService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    public function __construct(
        protected AuthService $authService
    ) {}

    /**
     * POST /login
     */
    public function login(LoginRequest $request): JsonResponse
    {
        $credentials = [
            'email' => $request->email,
            'password' => $request->password,
        ];

        if (!Auth::attempt($credentials)) {
            throw ValidationException::withMessages([
                'email' => [__('auth.failed')],
            ]);
        }

        $user = Auth::user();
        if ($user->status !== 'active') {
            Auth::logout();
            throw ValidationException::withMessages([
                'email' => ['Your account has been deactivated.'],
            ]);
        }

        $request->session()->regenerate();

        AuditLog::logEvent('login', $user->email, $request->ip(), $user->id);

        return response()->json([
            'message' => 'Login successful',
            'user' => $user,
        ]);
    }

    /**
     * GET /api/me
     */
    public function me(Request $request): JsonResponse
    {
        return response()->json([
            'user' => $request->user(),
        ]);
    }

    /**
     * POST /logout
     */
    public function logout(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user) {
            $user->tokens()->delete();
            AuditLog::logEvent('logout', $user->email, $request->ip(), $user->id);
        }

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return response()->json([
            'message' => 'Logged out successfully',
        ]);
    }

    // =========================================================================
    // Register
    // =========================================================================

    /**
     * POST /register/request-code
     */
    public function registerRequestCode(RegisterRequestCodeRequest $request): JsonResponse
    {
        $result = $this->authService->requestRegisterCode(
            $request->email,
            $request->name,
            $request->ip()
        );

        return response()->json([
            'message' => $result['message'],
        ]);
    }

    /**
     * POST /register
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $result = $this->authService->register(
            $request->email,
            $request->name,
            $request->verification_code,
            $request->password,
            $request->ip()
        );

        if (!$result['success']) {
            throw ValidationException::withMessages([
                $result['error'] => [$result['message']],
            ]);
        }

        // Auto-login after registration
        Auth::login($result['user']);
        $request->session()->regenerate();

        return response()->json([
            'message' => $result['message'],
            'user' => $result['user'],
        ], 201);
    }

    // =========================================================================
    // Forgot / Reset Password
    // =========================================================================

    /**
     * POST /forgot-password/request
     */
    public function forgotPasswordRequest(ForgotPasswordRequest $request): JsonResponse
    {
        $result = $this->authService->requestPasswordResetCode(
            $request->email,
            $request->ip()
        );

        return response()->json([
            'message' => $result['message'],
        ]);
    }

    /**
     * POST /forgot-password/reset
     */
    public function forgotPasswordReset(ResetPasswordRequest $request): JsonResponse
    {
        $result = $this->authService->resetPassword(
            $request->email,
            $request->verification_code,
            $request->password,
            $request->ip()
        );

        if (!$result['success']) {
            throw ValidationException::withMessages([
                $result['error'] => [$result['message']],
            ]);
        }

        return response()->json([
            'message' => $result['message'],
        ]);
    }

    // =========================================================================
    // Change Password (authenticated)
    // =========================================================================

    /**
     * POST /api/change-password
     */
    public function changePassword(ChangePasswordRequest $request): JsonResponse
    {
        $result = $this->authService->changePassword(
            $request->user(),
            $request->current_password,
            $request->password
        );

        if (!$result['success']) {
            throw ValidationException::withMessages([
                $result['error'] => [$result['message']],
            ]);
        }

        return response()->json([
            'message' => $result['message'],
        ]);
    }
}
