import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Sync user to Prisma database
      const { data: { user } } = await supabase.auth.getUser();

      if (user?.email) {
        const fullName = user.user_metadata?.full_name as string | undefined;
        let firstName: string | undefined;
        let lastName: string | undefined;

        if (fullName) {
          const parts = fullName.trim().split(/\s+/);
          firstName = parts[0];
          lastName = parts.length > 1 ? parts.slice(1).join(" ") : undefined;
        }

        await prisma.user.upsert({
          where: { email: user.email },
          update: {},
          create: {
            id: user.id,
            email: user.email,
            firstName: firstName ?? null,
            lastName: lastName ?? null,
          },
        });
      }

      return NextResponse.redirect(`${origin}/dashboard`);
    }
  }

  return NextResponse.redirect(`${origin}/auth/error`);
}
