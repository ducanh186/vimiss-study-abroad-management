<?php

namespace App\Policies;

use App\Models\Application;
use App\Models\Approval;
use App\Models\User;

class ApprovalPolicy
{
    /**
     * Mentor (for own application) or admin can submit for review.
     * Route middleware already enforces role:admin,mentor.
     */
    public function submitReview(User $user, Application $application): bool
    {
        if ($user->isAdmin()) {
            return true;
        }

        return $user->isMentor() && $application->mentor_id === $user->id;
    }

    /**
     * Reviewer/director/admin can act on step 1.
     * Route middleware enforces role:reviewer,director,admin.
     */
    public function approveStep1(User $user, Application $application): bool
    {
        return in_array($user->role, User::STEP1_APPROVER_ROLES, true);
    }

    /**
     * Director/admin can act on step 2.
     * Route middleware enforces role:director,admin.
     */
    public function approveStep2(User $user, Application $application): bool
    {
        return $user->isDirector() || $user->isAdmin();
    }
}
