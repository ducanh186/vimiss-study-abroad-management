<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Available roles in the system.
     * Stored as string enum in users.role column.
     */
    public const ROLES = ['admin', 'director', 'reviewer', 'mentor', 'student'];

    public const ROLE_ADMIN = 'admin';
    public const ROLE_DIRECTOR = 'director';
    public const ROLE_REVIEWER = 'reviewer';
    public const ROLE_MENTOR = 'mentor';
    public const ROLE_STUDENT = 'student';

    /**
     * Roles that have management access (reports, user overview).
     */
    public const MANAGEMENT_ROLES = ['admin', 'director'];

    /**
     * Roles that can approve Step 1 of the approval pipeline.
     */
    public const STEP1_APPROVER_ROLES = ['reviewer', 'director', 'admin'];

    /**
     * Roles that can approve Step 2 of the approval pipeline.
     */
    public const STEP2_APPROVER_ROLES = ['director'];

    protected $fillable = [
        'name',
        'email',
        'password',
        'role',
        'status',
        'must_change_password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'must_change_password' => 'boolean',
        ];
    }

    public function isAdmin(): bool
    {
        return $this->role === self::ROLE_ADMIN;
    }

    public function isDirector(): bool
    {
        return $this->role === self::ROLE_DIRECTOR;
    }

    public function isReviewer(): bool
    {
        return $this->role === self::ROLE_REVIEWER;
    }

    public function isMentor(): bool
    {
        return $this->role === self::ROLE_MENTOR;
    }

    public function isStudent(): bool
    {
        return $this->role === self::ROLE_STUDENT;
    }

    public function isManagement(): bool
    {
        return in_array($this->role, self::MANAGEMENT_ROLES);
    }

    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    public function hasAnyRole(array $roles): bool
    {
        return in_array($this->role, $roles);
    }

    public function scopeByRole($query, ?string $role)
    {
        if ($role) {
            return $query->where('role', $role);
        }
        return $query;
    }

    public function scopeSearch($query, ?string $search)
    {
        if ($search) {
            return $query->where(function ($q) use ($search) {
                $q->where('email', 'like', "%{$search}%")
                  ->orWhere('name', 'like', "%{$search}%");
            });
        }
        return $query;
    }

    // ── Relationships ──────────────────────────────────────────────

    public function mentorProfile(): HasOne
    {
        return $this->hasOne(MentorProfile::class);
    }

    public function studentProfile(): HasOne
    {
        return $this->hasOne(StudentProfile::class);
    }

    /**
     * Students assigned to this mentor (active only)
     */
    public function mentorStudents(): HasMany
    {
        return $this->hasMany(MentorStudentAssignment::class, 'mentor_id')->whereNull('unassigned_at');
    }

    /**
     * Mentor assignment for this student (active only)
     */
    public function studentMentorAssignment()
    {
        return $this->hasOne(MentorStudentAssignment::class, 'student_id')->whereNull('unassigned_at');
    }

    /**
     * Applications as student
     */
    public function studentApplications(): HasMany
    {
        return $this->hasMany(Application::class, 'student_id');
    }

    /**
     * Applications as mentor
     */
    public function mentorApplications(): HasMany
    {
        return $this->hasMany(Application::class, 'mentor_id');
    }

    public function notifications(): HasMany
    {
        return $this->hasMany(Notification::class);
    }
}
