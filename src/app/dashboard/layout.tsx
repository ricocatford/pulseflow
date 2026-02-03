import { redirect } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import {
    IconActivity,
    IconLayoutDashboard,
    IconRadar,
    IconSettings,
} from "@tabler/icons-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { UserMenu } from "@/components/features/UserMenu";
import { Separator } from "@/components/ui/separator";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

const navItems = [
    {
        href: "/dashboard",
        label: "Overview",
        icon: IconLayoutDashboard,
    },
    {
        href: "/dashboard/signals",
        label: "Signals",
        icon: IconRadar,
    },
    {
        href: "/dashboard/settings",
        label: "Settings",
        icon: IconSettings,
    },
];

export default async function DashboardLayout({
    children,
}: DashboardLayoutProps) {
    const supabase = await createSupabaseServerClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
                <div className="flex h-16 items-center justify-between px-4 md:px-6">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <IconActivity className="h-6 w-6" />
                        <span className="text-xl font-semibold">PulseFlow</span>
                    </Link>
                    <UserMenu email={user.email ?? ""} />
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className="hidden w-64 shrink-0 border-r bg-muted/30 md:block h-[calc(100vh-65px)]">
                    <nav className="flex flex-col gap-1 p-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href as Route}
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                            >
                                <item.icon className="h-4 w-4" />
                                {item.label}
                            </Link>
                        ))}
                    </nav>
                    <Separator />
                    <div className="p-4">
                        <p className="text-xs text-muted-foreground">
                            Monitor web changes and get AI-powered alerts
                        </p>
                    </div>
                </aside>

                {/* Main content */}
                <main className="flex-1 overflow-auto">
                    <div className="container mx-auto p-4 md:p-6 lg:p-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
}
