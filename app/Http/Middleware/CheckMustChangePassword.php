<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * CheckMustChangePassword Middleware
 * Blocks access to protected routes if user must change password first.
 */
class CheckMustChangePassword
{
    protected array $allowedRoutes = [
        'api/change-password',
        'logout',
        'api/me',
        'api/profile',
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if ($user && $user->must_change_password) {
            $path = $request->path();

            foreach ($this->allowedRoutes as $allowed) {
                if (str_starts_with($path, $allowed)) {
                    return $next($request);
                }
            }

            return response()->json([
                'message' => 'Password change required.',
                'error' => 'MUST_CHANGE_PASSWORD',
                'must_change_password' => true,
                'redirect' => '/change-password',
            ], 409);
        }

        return $next($request);
    }
}
