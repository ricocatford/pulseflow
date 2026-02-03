"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { AppError, err, ok, Result } from "@/lib/errors";
import type { Pulse, Signal } from "@prisma/client";

interface PulseWithDetails extends Pulse {
  signal: Pick<Signal, "id" | "name" | "url">;
}

interface PulseDetailResult {
  pulse: PulseWithDetails;
  previousPulse: Pulse | null;
}

// Auth helper
async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Get a single pulse by ID with previous pulse for diff
export async function getPulseById(
  id: string
): Promise<Result<PulseDetailResult>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return err(new AppError("Unauthorized", "AUTH_ERROR", 401));
  }

  try {
    const pulse = await prisma.pulse.findFirst({
      where: {
        id,
        signal: { userId: user.id },
      },
      include: {
        signal: {
          select: { id: true, name: true, url: true },
        },
      },
    });

    if (!pulse) {
      return err(new AppError("Pulse not found", "NOT_FOUND", 404));
    }

    // Get the previous pulse for comparison
    const previousPulse = await prisma.pulse.findFirst({
      where: {
        signalId: pulse.signalId,
        status: "SUCCESS",
        createdAt: { lt: pulse.createdAt },
      },
      orderBy: { createdAt: "desc" },
    });

    return ok({ pulse, previousPulse });
  } catch (error) {
    console.error("[getPulseById] Error:", error);
    return err(
      new AppError("Failed to fetch pulse", "FETCH_ERROR", 500, {
        originalError: error instanceof Error ? error.message : String(error),
      })
    );
  }
}
