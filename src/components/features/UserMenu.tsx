"use client";

import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import { IconLogout, IconSettings, IconUser } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface UserMenuProps {
    email: string;
    displayName: string | null;
}

export function UserMenu({ email, displayName }: UserMenuProps) {
    const router = useRouter();
    const supabase = createSupabaseBrowserClient();

    async function handleSignOut() {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 cursor-pointer"
                >
                    <IconUser className="h-4 w-4" />
                    <span className="text-sm text-muted-foreground">
                        {displayName ?? email}
                    </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem asChild>
                    <Link
                        href={"/dashboard/account" as Route}
                        className="flex items-center gap-2"
                    >
                        <IconSettings className="h-4 w-4" />
                        Account settings
                    </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                    onClick={handleSignOut}
                    className="flex items-center gap-2"
                >
                    <IconLogout className="h-4 w-4" />
                    Sign out
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
