<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes - Protected by Sanctum
|--------------------------------------------------------------------------
|
| RBAC Matrix:
| ┌───────────┬─────────────────────────────────────────────────────────┐
| │ Role      │ Permissions                                             │
| ├───────────┼─────────────────────────────────────────────────────────┤
| │ admin     │ Full access + User management + Reports                 │
| │ director  │ Global reports + Mentor allocation + Approvals           │
| │ mentor    │ Manage assigned students + Applications + Documents      │
| │ student   │ View info + Choose mentor + Track timeline               │
| └───────────┴─────────────────────────────────────────────────────────┘
*/

Route::middleware(['auth:sanctum', 'must_change_password'])->group(function () {
    // Current user
    Route::get('/me', [AuthController::class, 'me']);
    Route::post('/change-password', [AuthController::class, 'changePassword']);

    // Profile (self)
    Route::get('/profile', [ProfileController::class, 'show']);
    Route::put('/profile', [ProfileController::class, 'update']);

    /*
    |--------------------------------------------------------------------------
    | ADMIN ONLY ROUTES
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin')->group(function () {
        // User management
        Route::get('/users', [UserController::class, 'index']);
        Route::post('/users', [UserController::class, 'store']);
        Route::get('/users/{user}', [UserController::class, 'show']);
        Route::patch('/users/{user}/role', [UserController::class, 'updateRole']);
        Route::delete('/users/{user}', [UserController::class, 'destroy']);
        Route::get('/roles', [UserController::class, 'roles']);
    });

    /*
    |--------------------------------------------------------------------------
    | ADMIN + DIRECTOR ROUTES
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin,director')->group(function () {
        // Reports (placeholder for Phase 5)
    });

    /*
    |--------------------------------------------------------------------------
    | MENTOR ROUTES (admin + director + mentor)
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin,director,mentor')->group(function () {
        // Mentor-accessible routes (placeholder for Phase 3)
    });
});

/**
 * Health check (public)
 */
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'timestamp' => now()->toISOString(),
    ]);
});
