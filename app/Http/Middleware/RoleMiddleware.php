<?php

namespace App\Http\Middleware;

use App\Enums\UserRole;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->user();

        if (! $user || ! in_array($user->role->value, $roles)) {
            if (! $user) {
                return redirect()->route('login');
            }

            return redirect($this->homeForRole($user->role));
        }

        return $next($request);
    }

    private function homeForRole(UserRole $role): string
    {
        return match ($role) {
            UserRole::ADMIN  => route('dashboard'),
            UserRole::MASTER => route('master.dashboard'),
            default          => route('account.dashboard'),
        };
    }
}
