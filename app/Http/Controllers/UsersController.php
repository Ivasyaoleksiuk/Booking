<?php

namespace App\Http\Controllers;

use App\Enums\UserRole;
use App\Models\User;
use App\Repositories\UserRepository;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

class UsersController extends Controller
{
    private UserRepository $userRepository;

    public function __construct() {
        $this->userRepository = new UserRepository();
    }

    public function show(Request $request) {
        $search = $request->query('search', '');
        $role   = $request->query('role', '');

        return Inertia::render('patients', [
            'users'   => $this->userRepository->paginate($search ?: null, $role ?: null),
            'filters' => ['search' => $search, 'role' => $role],
        ]);
    }

    public function edit(User $user) {
        return Inertia::render('admin/edit-user', [
            'user' => $user,
            'roles' => UserRole::cases(),
        ]);
    }

    public function update(Request $request, User $user) {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'email', 'unique:users,email,' . $user->id],
            'phone'    => ['nullable', 'string', 'max:30'],
            'role'     => ['required', 'in:admin,master,client'],
            'password' => ['nullable', 'string', 'min:6'],
        ]);

        $result = $this->userRepository->updateUser($user, $validated);

        if ($result) {
            return redirect()->route('users')->with('success', 'Користувача оновлено.');
        } else {
            return redirect()->route('users')->with('error', 'Щось пішло не так.');
        }
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($user->id === $request->user()->id) {
            return back()->with('error', 'Не можна видалити власний акаунт.');
        }

        $user->delete();

        return back()->with('success', 'Користувача видалено.');
    }
}
