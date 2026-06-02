import { type User } from '@/types';
import { CalendarCheck, Pencil, Trash } from 'lucide-react';
import { Link, router } from '@inertiajs/react';
import { schedule, users_destroy, users_edit } from '@/routes';

const roleLabels: Record<string, string> = {
    admin:  'Адмін',
    master: 'Майстер',
    client: 'Клієнт',
};

interface UsersTableProps {
    users: User[];
}

export function UsersTable({ users }: UsersTableProps) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full rounded-lg border border-border bg-card text-card-foreground shadow-sm">
                <thead>
                    <tr className="bg-muted text-muted-foreground text-sm">
                        <th className="px-4 py-3 text-left">#</th>
                        <th className="px-4 py-3 text-left">ПІБ</th>
                        <th className="px-4 py-3 text-left">Email</th>
                        <th className="px-4 py-3 text-left">Створено</th>
                        <th className="px-4 py-3 text-left">Роль</th>
                        <th className="px-4 py-3 text-right">Дії</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user: User) => {
                        const role = user.role as string;
                        const isMaster = role === 'master';
                        const createdAt = user.created_at
                            ? new Date(user.created_at as string).toLocaleDateString('uk-UA')
                            : '—';

                        return (
                            <tr
                                key={user.id as number}
                                className="border-t border-border text-sm transition-colors hover:bg-popover hover:text-popover-foreground"
                            >
                                <td className="px-4 py-3 text-gray-400">{user.id as number}</td>
                                <td className="px-4 py-3 font-medium">{user.name as string}</td>
                                <td className="px-4 py-3 text-gray-600">{user.email as string}</td>
                                <td className="px-4 py-3 text-gray-500">{createdAt}</td>
                                <td className="px-4 py-3">
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                                        role === 'admin'  ? 'bg-purple-100 text-purple-700' :
                                        role === 'master' ? 'bg-blue-100   text-blue-700'   :
                                                            'bg-gray-100   text-gray-600'
                                    }`}>
                                        {roleLabels[role] ?? role}
                                    </span>
                                </td>
                                <td className="px-4 py-3 text-right">
                                    <div className="inline-flex items-center gap-1">
                                        {isMaster && (
                                            <Link
                                                href={`${schedule().url}?selectedMasterId=${user.id as number}`}
                                                className="inline-flex items-center gap-1 rounded px-2 py-1 text-xs text-emerald-700 hover:bg-emerald-50"
                                                title="Розклад майстра"
                                            >
                                                <CalendarCheck className="h-3.5 w-3.5" />
                                                Розклад
                                            </Link>
                                        )}
                                        <Link
                                            href={users_edit.url(user.id as number)}
                                            className="inline-flex rounded p-2 text-primary hover:bg-primary/10 transition-colors"
                                            title="Редагувати"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Link>
                                        <button
                                            className="inline-flex rounded p-2 text-destructive hover:bg-destructive/10 transition-colors"
                                            title="Видалити"
                                            onClick={() => {
                                                if (confirm(`Видалити користувача «${user.name as string}»?`)) {
                                                    router.delete(users_destroy(user).url);
                                                }
                                            }}
                                        >
                                            <Trash className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    {users.length === 0 && (
                        <tr>
                            <td colSpan={6} className="px-4 py-6 text-center text-muted-foreground">
                                Користувачів не знайдено
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

