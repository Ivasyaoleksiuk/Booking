<?php

namespace App\Policies;

use App\Enums\UserRole;
use App\Models\Schedule;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class SchedulePolicy
{
    /**
     * Determine whether the user can view any models.
     */
    public function viewAny(User $user): bool
    {
        return in_array($user->role, [UserRole::ADMIN, UserRole::MASTER]);
    }

    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Schedule $schedule): bool
    {
        return $user->role === UserRole::ADMIN || $user->id === $schedule->user_id;
    }

    /**
     * Determine whether the user can create models.
     */
    public function create(User $user): bool
    {

        return true;

        return $user->role === UserRole::ADMIN || $user->role === UserRole::MASTER;
    }

    /**
     * Determine whether the user can update the model.
     */
    public function update(User $user): bool
    {
        return $user->role === UserRole::ADMIN || $user->role === UserRole::MASTER;
    }

    /**
     * Determine whether the user can delete the model.
     */
    public function delete(User $user, Schedule $schedule): bool
    {
        return $user->role === UserRole::ADMIN || $user->role === UserRole::MASTER;
    }
}
