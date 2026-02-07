"use client";

import { useState } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter, usePathname } from "next/navigation";
import {
    IconMenu2,
    IconX,
    IconLayoutDashboard,
    IconRadar,
    IconSettings,
    IconLogout,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

const navItems = [
    { href: "/dashboard", label: "Overview", icon: IconLayoutDashboard },
    { href: "/dashboard/signals", label: "Signals", icon: IconRadar },
];

export function MobileMenu() {
    const [open, setOpen] = useState(false);
    const router = useRouter();
    const pathname = usePathname();
    const supabase = createSupabaseBrowserClient();

    async function handleSignOut() {
        setOpen(false);
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    }

    return (
        <div className="xs:hidden">
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setOpen(!open)}
                aria-label={open ? "Close menu" : "Open menu"}
                className="cursor-pointer"
            >
                {open ? (
                    <IconX className="h-5 w-5" />
                ) : (
                    <IconMenu2 className="h-5 w-5" />
                )}
            </Button>

            {open && (
                <div className="fixed left-0 right-0 top-16 z-40 bg-background border-t h-[calc(100dvh-4rem)] overflow-hidden flex flex-col items-center">
                    <div className="w-full p-4">
                        <nav className="flex flex-col gap-1">
                            {navItems.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href as Route}
                                    onClick={() => setOpen(false)}
                                    className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                                        pathname === item.href
                                            ? "bg-accent text-accent-foreground"
                                            : "text-muted-foreground"
                                    }`}
                                >
                                    <item.icon className="h-5 w-5" />
                                    {item.label}
                                </Link>
                            ))}
                        </nav>
                        <Separator className="my-2" />
                        <div className="flex flex-col gap-1">
                            <Link
                                href={"/dashboard/account" as Route}
                                onClick={() => setOpen(false)}
                                className={`flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground ${
                                    pathname === "/dashboard/account"
                                        ? "bg-accent text-accent-foreground"
                                        : "text-muted-foreground"
                                }`}
                            >
                                <IconSettings className="h-5 w-5" />
                                Account settings
                            </Link>
                            <button
                                onClick={handleSignOut}
                                className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground w-full text-left cursor-pointer"
                            >
                                <IconLogout className="h-5 w-5" />
                                Sign out
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
