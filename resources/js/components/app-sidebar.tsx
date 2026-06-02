import { NavFooter } from '@/components/nav-footer';
import { NavMain } from '@/components/nav-main';
import { NavUser } from '@/components/nav-user';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { appointments, dashboard, users, schedule } from '@/routes';
import { appointments as masterAppointments, schedule as masterSchedule } from '@/actions/App/Http/Controllers/Master/MasterController';
import { type NavItem } from '@/types';
import { Link, usePage } from '@inertiajs/react';
import { LayoutGrid, Users, CalendarCheck, ListCheck, ServerIcon, CalendarDays } from 'lucide-react';
import AppLogo from './app-logo';
import { useEffect, useState } from 'react';

const footerNavItems: NavItem[] = [];

export function AppSidebar() {
    const [navItems, setNavItems] = useState<NavItem[]>([]);
    const page = usePage();

    useEffect(() => {
        const role = page.props.auth.user.role as string;

        if (role === 'admin') {
            setNavItems([
                {
                    title: 'Дашборд',
                    href: dashboard(),
                    icon: LayoutGrid,
                },
                {
                    title: 'Бронювання',
                    href: appointments(),
                    icon: ListCheck,
                },
                {
                    title: 'Користувачі',
                    href: users(),
                    icon: Users,
                },
                {
                    title: 'Налаштування розкладу',
                    href: schedule(),
                    icon: CalendarCheck,
                },
                {
                    title: 'Послуги',
                    href: '/admin/services',
                    icon: ServerIcon,
                },
            ]);
        } else if (role === 'master') {
            setNavItems([
                {
                    title: 'Записи на день',
                    href: masterAppointments(),
                    icon: ListCheck,
                },
                {
                    title: 'Мій розклад',
                    href: masterSchedule(),
                    icon: CalendarCheck,
                },
            ]);
        } else {
            setNavItems([
                {
                    title: 'Мої записи',
                    href: '/account',
                    icon: CalendarDays,
                },
            ]);
        }
    }, []);
        const role = page.props.auth.user.role as string;
        const homeHref = role === 'master' ? masterAppointments().url : role === 'client' ? '/account' : dashboard().url;

        return (
            <Sidebar collapsible="icon" variant="inset">
                <SidebarHeader>
                    <SidebarMenu>
                        <SidebarMenuItem>
                            <SidebarMenuButton size="lg" asChild>
                                <Link href={homeHref} prefetch>
                                    <AppLogo />
                                </Link>
                            </SidebarMenuButton>
                        </SidebarMenuItem>
                    </SidebarMenu>
                </SidebarHeader>

                <SidebarContent>
                    <NavMain items={navItems} />
                </SidebarContent>

                <SidebarFooter>
                    <NavFooter items={footerNavItems} className="mt-auto" />
                    <NavUser />
                </SidebarFooter>
            </Sidebar>
        );
}
