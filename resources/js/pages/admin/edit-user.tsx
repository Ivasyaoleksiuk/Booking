import AppLayout from '@/layouts/app-layout';
import { users, users_update } from '@/routes';
import { type BreadcrumbItem, User } from '@/types';
import { Head, Link, useForm } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Користувачі', href: users().url },
    { title: 'Редагувати користувача', href: users().url },
];

const roleLabels: Record<string, string> = {
    admin:  'Адмін',
    master: 'Майстер',
    client: 'Клієнт',
};

interface editUserProps {
    user: User;
    roles: { name: string; value: string }[];
}

export default function EditUser({ user, roles }: editUserProps) {
    const [showPassword, setShowPassword] = useState(false);

    const { data, setData, put, processing, errors } = useForm({
        name:     (user?.name  as string) || '',
        email:    (user?.email as string) || '',
        phone:    (user?.phone as string) || '',
        role:     (user?.role  as string) || 'client',
        password: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setData(e.target.name as keyof typeof data, e.target.value);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        put(users_update(user).url);
    };

    const field = (label: string, name: keyof typeof data, type = 'text', extra?: React.ReactNode) => (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <div className="relative">
                <input
                    type={type === 'password' ? (showPassword ? 'text' : 'password') : type}
                    name={name}
                    value={data[name]}
                    onChange={handleChange}
                    placeholder={type === 'password' ? 'Залиште порожнім, щоб не змінювати' : undefined}
                    className="block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
                {extra}
            </div>
            {errors[name] && <p className="mt-1 text-xs text-red-500">{errors[name]}</p>}
        </div>
    );

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Редагувати користувача" />
            <div className="p-6 max-w-lg">
                <form onSubmit={handleSubmit} className="space-y-5 rounded-xl border bg-white p-6 shadow-sm">
                    <h2 className="text-lg font-semibold text-gray-800">Редагування профілю</h2>

                    {field("Ім'я", 'name')}
                    {field('Email', 'email', 'email')}
                    {field('Телефон', 'phone', 'tel')}

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Роль</label>
                        <select
                            name="role"
                            value={data.role}
                            onChange={handleChange}
                            className="block w-full rounded-lg border px-3 py-2 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                        >
                            {roles.map((r) => (
                                <option key={r.value} value={r.value}>
                                    {roleLabels[r.value] ?? r.value}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Новий пароль
                            <span className="ml-1 text-xs font-normal text-gray-400">(залиште порожнім, щоб не змінювати)</span>
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={data.password}
                                onChange={handleChange}
                                placeholder="Мінімум 6 символів"
                                className="block w-full rounded-lg border px-3 py-2 pr-10 text-sm shadow-sm focus:ring-2 focus:ring-blue-500 focus:outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password}</p>}
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <Link
                            href={users().url}
                            className="rounded-lg border px-4 py-2 text-sm hover:bg-gray-50"
                        >
                            Назад
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="rounded-lg bg-blue-600 px-6 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-60"
                        >
                            {processing ? 'Збереження...' : 'Зберегти'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}
