import AppLayout from '@/layouts/app-layout';
import { users } from '@/routes';
import { type BreadcrumbItem, User } from '@/types';
import { Head, router } from '@inertiajs/react';
import { UsersTable } from '@/components/users-table';
import { useEffect, useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Користувачі',
        href: users().url,
    },
];

interface PaginationLink {
    url: string | null;
    label: string;
    active: boolean;
}

interface Paginator {
    data: User[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: PaginationLink[];
}

interface Filters {
    search: string;
    role: string;
}

interface patientProps {
    users: Paginator;
    filters: Filters;
}

const roleLabels: Record<string, string> = {
    '':       'Всі ролі',
    admin:    'Адмін',
    master:   'Майстер',
    client:   'Клієнт',
};

export default function Patients({ users: paginator, filters }: patientProps) {
    const [searchInput, setSearchInput] = useState(filters.search);

    useEffect(() => {
        const timeout = setTimeout(() => {
            router.get(
                users().url,
                { search: searchInput, role: filters.role },
                { preserveState: true, replace: true },
            );
        }, 400);
        return () => clearTimeout(timeout);
    }, [searchInput]);

    const handleRoleChange = (role: string) => {
        router.get(
            users().url,
            { search: filters.search, role },
            { preserveState: true, replace: true },
        );
    };

    const handlePageChange = (url: string) => {
        router.get(url, {}, { preserveState: true });
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Користувачі" />
            <div className="flex h-full flex-1 flex-col gap-4 overflow-x-auto rounded-xl p-4">
                <div className="relative min-h-[100vh] flex-1 overflow-hidden rounded-xl border border-sidebar-border/70 md:min-h-min dark:border-sidebar-border">

                    {/* Filters */}
                    <div className="flex items-center gap-3 border-b p-4">
                        <input
                            type="text"
                            placeholder="Пошук за ім'ям або email..."
                            value={searchInput}
                            onChange={(e) => setSearchInput(e.target.value)}
                            className="w-72 rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        />
                        <select
                            value={filters.role}
                            onChange={(e) => handleRoleChange(e.target.value)}
                            className="rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black"
                        >
                            {Object.entries(roleLabels).map(([value, label]) => (
                                <option key={value} value={value}>{label}</option>
                            ))}
                        </select>
                        <span className="ml-auto text-sm text-gray-500">
                            Всього: {paginator.total}
                        </span>
                    </div>

                    <UsersTable users={paginator.data} />

                    {/* Pagination */}
                    {paginator.last_page > 1 && (
                        <div className="flex items-center justify-between border-t px-4 py-3">
                            <span className="text-sm text-gray-500">
                                {paginator.from}–{paginator.to} з {paginator.total}
                            </span>
                            <div className="flex gap-1">
                                {paginator.links.map((link, i) => (
                                    <button
                                        key={i}
                                        disabled={!link.url || link.active}
                                        onClick={() => link.url && handlePageChange(link.url)}
                                        className={`min-w-[32px] rounded px-2 py-1 text-sm ${
                                            link.active
                                                ? 'bg-black text-white'
                                                : link.url
                                                  ? 'border hover:bg-gray-100'
                                                  : 'border text-gray-300'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}