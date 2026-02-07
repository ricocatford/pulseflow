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
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
            >
                <IconSettings className="h-4 w-4" />
                Account settings
            </Link>
            <button
                onClick={handleSignOut}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground w-full text-left"
            >
                <IconLogout className="h-4 w-4" />
                Sign out
            </button>
        </div>
    );
}
