<?php

namespace App\Policies;

use App\Models\MentorProfile;
use App\Models\User;

class MentorProfilePolicy
{
    /**
     * Admin can manage all mentors
     */
    public function viewAny(User $user): bool
    {
        return $user->hasAnyRole(['admin', 'director', 'student']);
    }

    public function view(User $user, MentorProfile $profile): bool
    {
        return $user->isAdmin() || $user->isDirector() || $user->isStudent()
            || $user->id === $profile->user_id;
    }

    public function create(User $user): bool
    {
        return $user->isAdmin();
    }

    public function update(User $user, MentorProfile $profile): bool
    {
        return $user->isAdmin();
    }

    public function delete(User $user, MentorProfile $profile): bool
    {
        return $user->isAdmin();
    }

    /**
     * Only admin can disable/enable mentors
     */
    public function toggleActive(User $user): bool
    {
        return $user->isAdmin();
    }
}
