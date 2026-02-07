"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { IconLogout, IconSettings } from "@tabler/icons-react";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

export function SidebarActions() {
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();

    async function handleSignOut() {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    }

    return (
        <div className="flex flex-col gap-1">
            <Link
                href={"/dashboard/account" as Route}
                className="flex items-center justify-center md:justify-start gap-3 rounded-lg px-2 md:px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                title="Account settings"
            >
                <IconSettings className="h-4 w-4 shrink-0" />
                <span className="hidden md:inline">Account settings</span>
            </Link>
            <button
                onClick={handleSignOut}
                className="flex items-center justify-center md:justify-start gap-3 rounded-lg px-2 md:px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground w-full text-left cursor-pointer"
                title="Sign out"
            >
                <IconLogout className="h-4 w-4 shrink-0" />
                <span className="hidden md:inline">Sign out</span>
            </button>
        </div>
    );
}
