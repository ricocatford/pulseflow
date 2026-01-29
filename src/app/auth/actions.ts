"use server";

import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { AppError, err, ok, Result } from "@/lib/errors";

type OAuthProvider = "google" | "facebook";

interface SignInResult {
  url: string;
}

interface SignUpData {
  email: string;
  password: string;
}

interface SignUpResult {
  message: string;
}

export async function signUpWithEmail(
  data: SignUpData
): Promise<Result<SignUpResult>> {
  const supabase = await createSupabaseServerClient();

  const { data: authData, error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return err(new AppError(error.message, "AUTH_ERROR", 400));
  }

  // Sync user to Prisma database
  if (authData.user?.email) {
    await prisma.user.upsert({
      where: { email: authData.user.email },
      update: {},
      create: {
        id: authData.user.id,
        email: authData.user.email,
      },
    });
  }

  return ok({ message: "Account created successfully" });
}

export async function signInWithEmail(
  data: SignUpData
): Promise<Result<SignUpResult>> {
  const supabase = await createSupabaseServerClient();

  const { data: authData, error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return err(new AppError(error.message, "AUTH_ERROR", 401));
  }

  // Sync user to Prisma database
  if (authData.user?.email) {
    await prisma.user.upsert({
      where: { email: authData.user.email },
      update: {},
      create: {
        id: authData.user.id,
        email: authData.user.email,
      },
    });
  }

  return ok({ message: "Signed in successfully" });
}

export async function signInWithProvider(
  provider: OAuthProvider
): Promise<Result<SignInResult>> {
  const supabase = await createSupabaseServerClient();
  const headersList = await headers();
  const origin = headersList.get("origin") ?? headersList.get("host") ?? "";

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return err(
      new AppError(error.message, "AUTH_ERROR", 401, { provider })
    );
  }

  if (!data.url) {
    return err(
      new AppError("No redirect URL returned from Supabase", "AUTH_ERROR", 500, {
        provider,
      })
    );
  }

  return ok({ url: data.url });
}
