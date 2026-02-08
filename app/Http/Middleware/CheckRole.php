<?php

namespace App\Http\Middleware;

use App\Models\User;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * CheckRole Middleware
 * 
 * Usage in routes:
 *   ->middleware('role:admin')           // single role
 *   ->middleware('role:admin,director')  // multiple roles (OR)
 */
class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles): Response
    {
        $user = $request->user();

        if (!$user) {
            return response()->json([
                'message' => 'Unauthenticated.',
            ], 401);
        }

        $allowedRoles = [];
        foreach ($roles as $role) {
            $allowedRoles = array_merge($allowedRoles, explode(',', $role));
        }
        $allowedRoles = array_map('trim', $allowedRoles);

        if (!$user->hasAnyRole($allowedRoles)) {
            return response()->json([
                'message' => 'Forbidden. You do not have permission to access this resource.',
                'required_roles' => $allowedRoles,
                'your_role' => $user->role,
            ], 403);
        }

        return $next($request);
    }
}
