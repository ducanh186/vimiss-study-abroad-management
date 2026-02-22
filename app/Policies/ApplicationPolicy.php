<?php

namespace App\Policies;

use App\Models\Application;
use App\Models\User;

class ApplicationPolicy
{
    /**
     * Admin/director can see all. Mentor sees own apps. Student sees own apps.
     */
    public function viewAny(User $user): bool
    {
        return true; // filtered by controller
    }

    public function view(User $user, Application $application): bool
    {
        if ($user->isAdmin() || $user->isDirector()) return true;
        if ($user->isMentor() && $application->mentor_id === $user->id) return true;
        if ($user->isStudent() && $application->student_id === $user->id) return true;
        return false;
    }

    /**
     * Only mentor can create application (for their assigned student)
     */
    public function create(User $user): bool
    {
        return $user->isMentor() || $user->isAdmin();
    }

    /**
     * Mentor (owner) or admin can update
     */
    public function update(User $user, Application $application): bool
    {
        if ($user->isAdmin()) return true;
        if ($user->isMentor() && $application->mentor_id === $user->id) return true;
        return false;
    }

    /**
     * Only admin can reassign mentor on application
     */
    public function reassign(User $user): bool
    {
        return $user->isAdmin();
    }

    /**
     * Only admin can force status override
     */
    public function overrideStatus(User $user): bool
    {
        return $user->isAdmin();
    }
}
