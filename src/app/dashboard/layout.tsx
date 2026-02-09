import { redirect } from "next/navigation";
import Link from "next/link";
import type { Route } from "next";
import {
    IconActivity,
    IconLayoutDashboard,
    IconRadar,
} from "@tabler/icons-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { UserMenu } from "@/components/features/UserMenu";
import { SidebarActions } from "@/components/features/SidebarActions";
import { MobileMenu } from "@/components/features/MobileMenu";
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

    let displayName: string | null = null;
    try {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { firstName: true, lastName: true },
        });
        if (dbUser?.firstName || dbUser?.lastName) {
            displayName = [dbUser.firstName, dbUser.lastName]
                .filter(Boolean)
                .join(" ");
        }
    } catch (error) {
        console.error("[DashboardLayout] Failed to fetch user profile:", error);
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
                    <div className="flex items-center gap-2">
                        <UserMenu
                            email={user.email ?? ""}
                            displayName={displayName}
                        />
                        <MobileMenu />
                    </div>
                </div>
            </header>

            <div className="flex">
                {/* Sidebar */}
                <aside className="hidden xs:block xs:w-14 lg:w-64 shrink-0 border-r bg-muted/30 min-h-[calc(100vh-65px)]">
                    <nav className="flex flex-col gap-1 p-2 lg:p-4">
                        {navItems.map((item) => (
                            <Link
                                key={item.href}
                                href={item.href as Route}
                                className="flex items-center justify-center lg:justify-start gap-3 rounded-lg px-2 lg:px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                                title={item.label}
                            >
                                <item.icon className="h-4 w-4 shrink-0" />
                                <span className="hidden lg:inline">{item.label}</span>
                            </Link>
                        ))}
                    </nav>
                    <Separator />
                    <div className="p-2 lg:p-4">
                        <SidebarActions />
                    </div>
                    <Separator className="hidden lg:block" />
                    <div className="hidden lg:block p-4">
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
