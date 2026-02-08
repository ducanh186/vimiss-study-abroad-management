<?php

use App\Http\Controllers\AuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes - Sanctum SPA Authentication
|--------------------------------------------------------------------------
*/

Route::post('/login', [AuthController::class, 'login'])
    ->middleware('throttle:login');

Route::post('/logout', [AuthController::class, 'logout'])
    ->middleware('auth:sanctum');

Route::prefix('forgot-password')->group(function () {
    Route::post('/request', [AuthController::class, 'forgotPasswordRequest'])
        ->middleware('throttle:forgot-password-request');

    Route::post('/reset', [AuthController::class, 'forgotPasswordReset'])
        ->middleware('throttle:forgot-password-reset');
});

/*
|--------------------------------------------------------------------------
| SPA Catch-All Route
|--------------------------------------------------------------------------
*/

Route::view('/login', 'spa')->name('login');

Route::get('/{any}', function () {
    return view('spa');
})->where('any', '.*');
