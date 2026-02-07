"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { AppError, err, ok, Result } from "@/lib/errors";

interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
}

interface UpdateProfileInput {
  firstName: string;
  lastName: string;
}

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

export async function getUserProfile(): Promise<Result<UserProfile>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return err(new AppError("Unauthorized", "AUTH_ERROR", 401));
  }

  try {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    if (!dbUser) {
      return err(new AppError("User not found", "NOT_FOUND", 404));
    }

    return ok(dbUser);
  } catch (error) {
    console.error("[getUserProfile] Error:", error);
    return err(
      new AppError("Failed to fetch profile", "FETCH_ERROR", 500, {
        originalError: error instanceof Error ? error.message : String(error),
      })
    );
  }
}

export async function updateProfile(
  input: UpdateProfileInput
): Promise<Result<UserProfile>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return err(new AppError("Unauthorized", "AUTH_ERROR", 401));
  }

  try {
    const updated = await prisma.user.update({
      where: { id: user.id },
      data: {
        firstName: input.firstName.trim() || null,
        lastName: input.lastName.trim() || null,
      },
      select: { id: true, email: true, firstName: true, lastName: true },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/account");

    return ok(updated);
  } catch (error) {
    console.error("[updateProfile] Error:", error);
    return err(
      new AppError("Failed to update profile", "UPDATE_ERROR", 500, {
        originalError: error instanceof Error ? error.message : String(error),
      })
    );
  }
}

export async function changePassword(
  input: ChangePasswordInput
): Promise<Result<{ message: string }>> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return err(new AppError("Unauthorized", "AUTH_ERROR", 401));
  }

  if (!user.email) {
    return err(new AppError("No email associated with account", "AUTH_ERROR", 400));
  }

  try {
    // Verify current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: input.currentPassword,
    });

    if (signInError) {
      return err(new AppError("Current password is incorrect", "AUTH_ERROR", 400));
    }

    // Update password
    const { error: updateError } = await supabase.auth.updateUser({
      password: input.newPassword,
    });

    if (updateError) {
      return err(
        new AppError("Failed to update password", "UPDATE_ERROR", 500, {
          originalError: updateError.message,
        })
      );
    }

    return ok({ message: "Password updated successfully" });
  } catch (error) {
    console.error("[changePassword] Error:", error);
    return err(
      new AppError("Failed to change password", "UPDATE_ERROR", 500, {
        originalError: error instanceof Error ? error.message : String(error),
      })
    );
  }
}
