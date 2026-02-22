<?php

use App\Http\Controllers\ApplicationController;
use App\Http\Controllers\ApprovalController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CalendarEventController;
use App\Http\Controllers\DocumentController;
use App\Http\Controllers\MentorController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\ReviewRequestController;
use App\Http\Controllers\ScholarshipController;
use App\Http\Controllers\StudentProfileController;
use App\Http\Controllers\UniversityController;
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

    // ── Notifications (all authenticated users) ─────────────────
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'unreadCount']);
    Route::patch('/notifications/{notification}/read', [NotificationController::class, 'markRead']);
    Route::post('/notifications/mark-all-read', [NotificationController::class, 'markAllRead']);

    // ── Calendar events (all authenticated users can view) ──────
    Route::get('/calendar-events', [CalendarEventController::class, 'index']);
    Route::get('/calendar-events/{calendarEvent}', [CalendarEventController::class, 'show']);

    // ── Mentor directory (all authenticated) ────────────────────
    Route::get('/mentors/directory', [MentorController::class, 'index']);
    Route::get('/mentors/directory/{mentorUserId}', [MentorController::class, 'show']);

    // ── Scholarships (viewable by all authenticated) ────────────
    Route::get('/scholarships', [ScholarshipController::class, 'index']);
    Route::get('/scholarships/{scholarship}', [ScholarshipController::class, 'show']);

    /*
    |--------------------------------------------------------------------------
    | STUDENT ROUTES
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:student')->group(function () {
        Route::get('/student/profile', [StudentProfileController::class, 'show']);
        Route::put('/student/profile', [StudentProfileController::class, 'update']);
        Route::post('/student/choose-mentor', [StudentProfileController::class, 'chooseMentor']);
        Route::post('/student/random-mentor', [StudentProfileController::class, 'randomMentor']);
        Route::get('/student/my-mentor', [StudentProfileController::class, 'myMentor']);
    });

    /*
    |--------------------------------------------------------------------------
    | MENTOR ROUTES
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:mentor')->group(function () {
        Route::get('/mentor/my-students', [MentorController::class, 'myStudents']);
    });

    /*
    |--------------------------------------------------------------------------
    | ALL ROLES except student-only: Applications (view)
    | reviewer + director must be able to see apps they need to approve
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin,director,reviewer,mentor,student')->group(function () {
        Route::get('/applications', [ApplicationController::class, 'index']);
        Route::get('/applications/{application}', [ApplicationController::class, 'show']);
        Route::get('/applications/{application}/documents', [DocumentController::class, 'index']);
        Route::get('/documents/{document}/download', [DocumentController::class, 'download']);
        Route::get('/documents/{document}/preview', [DocumentController::class, 'preview']);

        // Document upload — students (own app), mentors (assigned), admin/director (any)
        // Anti-IDOR enforced inside DocumentController@store
        Route::post('/applications/{application}/documents', [DocumentController::class, 'store']);
    });

    /*
    |--------------------------------------------------------------------------
    | MENTOR + ADMIN: Applications (write), Documents, Reviews
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin,mentor')->group(function () {
        Route::post('/applications', [ApplicationController::class, 'store']);
        Route::put('/applications/{application}', [ApplicationController::class, 'update']);

        // Document label + delete (mentor/admin only)
        Route::patch('/documents/{document}/label', [DocumentController::class, 'updateLabel']);
        Route::delete('/documents/{document}', [DocumentController::class, 'destroy']);

        // Review requests (mentor submit)
        Route::get('/review-requests', [ReviewRequestController::class, 'index']);
        Route::post('/review-requests', [ReviewRequestController::class, 'store']);

        // Approval — submit for Step 1 review (mentor: own app only, admin: any)
        Route::post('/applications/{application}/submit-review', [ApprovalController::class, 'submitReview']);

        // Scholarship requests
        Route::post('/scholarship-requests', [ScholarshipController::class, 'createRequest']);
    });

    /*
    |--------------------------------------------------------------------------
    | REVIEWER + DIRECTOR + ADMIN: Step 1 approval actions
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:reviewer,director,admin')->group(function () {
        Route::post('/applications/{application}/approve-step1', [ApprovalController::class, 'approveStep1']);
        Route::post('/applications/{application}/reject-step1',  [ApprovalController::class, 'rejectStep1']);
    });

    /*
    |--------------------------------------------------------------------------
    | DIRECTOR + ADMIN: Step 2 approval actions
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:director,admin')->group(function () {
        Route::post('/applications/{application}/approve-step2', [ApprovalController::class, 'approveStep2']);
        Route::post('/applications/{application}/reject-step2',  [ApprovalController::class, 'rejectStep2']);
    });

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

        // Mentor management (admin CRUD)
        Route::get('/admin/mentors', [MentorController::class, 'adminIndex']);
        Route::post('/admin/mentors', [MentorController::class, 'store']);
        Route::put('/admin/mentors/{mentorUserId}', [MentorController::class, 'update']);
        Route::post('/admin/mentors/{mentorUserId}/disable', [MentorController::class, 'disable']);
        Route::post('/admin/mentors/{mentorUserId}/enable', [MentorController::class, 'enable']);

        // Assignment management
        Route::post('/admin/assign-mentor', [StudentProfileController::class, 'adminAssign']);
        Route::post('/admin/reassign-mentor', [StudentProfileController::class, 'adminReassign']);

        // Application reassign
        Route::post('/applications/{application}/reassign', [ApplicationController::class, 'reassign']);

        // Universities CRUD
        Route::post('/universities', [UniversityController::class, 'store']);
        Route::put('/universities/{university}', [UniversityController::class, 'update']);
        Route::delete('/universities/{university}', [UniversityController::class, 'destroy']);

        // Scholarships CRUD
        Route::post('/scholarships', [ScholarshipController::class, 'store']);
        Route::put('/scholarships/{scholarship}', [ScholarshipController::class, 'update']);
        Route::delete('/scholarships/{scholarship}', [ScholarshipController::class, 'destroy']);

        // Calendar events CRUD
        Route::post('/calendar-events', [CalendarEventController::class, 'store']);
        Route::put('/calendar-events/{calendarEvent}', [CalendarEventController::class, 'update']);
        Route::delete('/calendar-events/{calendarEvent}', [CalendarEventController::class, 'destroy']);
    });

    /*
    |--------------------------------------------------------------------------
    | ADMIN + DIRECTOR ROUTES
    |--------------------------------------------------------------------------
    */
    Route::middleware('role:admin,director')->group(function () {
        // Mentor load report
        Route::get('/reports/mentor-load', [MentorController::class, 'mentorLoad']);

        // Universities (view)
        Route::get('/universities', [UniversityController::class, 'index']);
        Route::get('/universities/{university}', [UniversityController::class, 'show']);

        // Review requests (approve/reject)
        Route::patch('/review-requests/{reviewRequest}/review', [ReviewRequestController::class, 'review']);

        // Student profiles (view any)
        Route::get('/admin/students/{userId}', [StudentProfileController::class, 'show']);
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
