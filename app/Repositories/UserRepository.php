<?php

namespace App\Repositories;

use App\Models\User;

class UserRepository
{

    public function getAll(?string $role = null) {
        $query = User::query();

        if ($role) {
            $query->where('role', $role);
        }

        return $query->orderBy('created_at')->get();
    }

    public function paginate(?string $search = null, ?string $role = null, int $perPage = 15)
    {
        $query = User::query();

        if ($role) {
            $query->where('role', $role);
        }

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%");
            });
        }

        return $query->orderBy('created_at')->paginate($perPage)->withQueryString();
    }

    public function updateUser($user, $data): bool
    {
        $fields = [
            'name'  => $data['name'],
            'email' => $data['email'],
            'phone' => $data['phone'],
            'role'  => $data['role'],
        ];

        if (!empty($data['password'])) {
            $fields['password'] = \Illuminate\Support\Facades\Hash::make($data['password']);
        }

        return $user->update($fields);
    }

    public function getById(Int $id)
    {
        return User::query()
            ->find($id);
    }

}