"use client";

import { useRouter } from "next/navigation";
import { IconLogout } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";

interface UserMenuProps {
  email: string;
}

export function UserMenu({ email }: UserMenuProps) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted-foreground">{email}</span>
      <Button variant="ghost" size="sm" onClick={handleSignOut}>
        <IconLogout className="h-4 w-4" />
        Sign out
      </Button>
    </div>
  );
}
