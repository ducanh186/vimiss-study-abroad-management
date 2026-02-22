<?php

namespace App\Policies;

use App\Models\ApplicationDocument;
use App\Models\User;

class ApplicationDocumentPolicy
{
    public function view(User $user, ApplicationDocument $document): bool
    {
        $app = $document->application;
        if ($user->isAdmin() || $user->isDirector()) return true;
        if ($user->isMentor() && $app->mentor_id === $user->id) return true;
        if ($user->isStudent() && $app->student_id === $user->id) return true;
        return false;
    }

    /**
     * Student (own app), mentor (assigned app), admin, or director can upload documents.
     */
    public function create(User $user, ?\App\Models\Application $application = null): bool
    {
        if ($user->isAdmin() || $user->isDirector()) return true;
        if ($user->isMentor() && $application && $application->mentor_id === $user->id) return true;
        if ($user->isStudent() && $application && $application->student_id === $user->id) return true;
        return false;
    }

    /**
     * Mentor can update label/notes, admin can also
     */
    public function update(User $user, ApplicationDocument $document): bool
    {
        $app = $document->application;
        if ($user->isAdmin()) return true;
        if ($user->isMentor() && $app->mentor_id === $user->id) return true;
        return false;
    }

    public function delete(User $user, ApplicationDocument $document): bool
    {
        $app = $document->application;
        if ($user->isAdmin()) return true;
        if ($user->isMentor() && $app->mentor_id === $user->id) return true;
        return false;
    }
}
