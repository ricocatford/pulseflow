"use server";

import { headers } from "next/headers";
import { createSupabaseServerClient } from "@/lib/supabase/server";
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

  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return err(new AppError(error.message, "AUTH_ERROR", 400));
  }

  return ok({ message: "Account created successfully" });
}

export async function signInWithEmail(
  data: SignUpData
): Promise<Result<SignUpResult>> {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });

  if (error) {
    return err(new AppError(error.message, "AUTH_ERROR", 401));
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
