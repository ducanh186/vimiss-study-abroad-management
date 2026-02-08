<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends Controller
{
    /**
     * GET /api/users
     * List all users (admin only).
     */
    public function index(Request $request): JsonResponse
    {
        $users = User::query()
            ->byRole($request->query('role'))
            ->search($request->query('search'))
            ->orderBy('created_at', 'desc')
            ->paginate($request->query('per_page', 15));

        return response()->json($users);
    }

    /**
     * POST /api/users
     * Create a new user (admin only).
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'string', 'min:8'],
            'role' => ['required', 'string', 'in:' . implode(',', User::ROLES)],
        ]);

        $validated['must_change_password'] = true;
        $validated['status'] = 'active';

        $user = User::create($validated);

        return response()->json([
            'message' => 'User created successfully.',
            'user' => $user,
        ], 201);
    }

    /**
     * GET /api/users/{user}
     */
    public function show(User $user): JsonResponse
    {
        return response()->json(['user' => $user]);
    }

    /**
     * PATCH /api/users/{user}/role
     * Update user role (admin only).
     */
    public function updateRole(Request $request, User $user): JsonResponse
    {
        $validated = $request->validate([
            'role' => ['required', 'string', 'in:' . implode(',', User::ROLES)],
        ]);

        $user->update(['role' => $validated['role']]);

        return response()->json([
            'message' => 'User role updated successfully.',
            'user' => $user->fresh(),
        ]);
    }

    /**
     * DELETE /api/users/{user}
     */
    public function destroy(User $user): JsonResponse
    {
        if ($user->id === auth()->id()) {
            return response()->json([
                'message' => 'You cannot delete your own account.',
            ], 403);
        }

        $user->update(['status' => 'inactive']);

        return response()->json([
            'message' => 'User deactivated successfully.',
        ]);
    }

    /**
     * GET /api/roles
     */
    public function roles(): JsonResponse
    {
        return response()->json([
            'roles' => User::ROLES,
        ]);
    }
}
