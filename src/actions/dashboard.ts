"use server";

import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { AppError, err, ok, Result } from "@/lib/errors";
import type { Pulse, Signal, Alert } from "@prisma/client";

interface DashboardStats {
  activeSignals: number;
  totalPulses: number;
  alertsToday: number;
}

interface RecentPulse extends Pulse {
  signal: Pick<Signal, "id" | "name" | "url">;
}

interface RecentAlert extends Alert {
  pulse: {
    signal: Pick<Signal, "id" | "name">;
  };
}

interface RecentActivityResult {
  pulses: RecentPulse[];
  alerts: RecentAlert[];
}

// Auth helper
async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Get dashboard stats
export async function getDashboardStats(): Promise<Result<DashboardStats>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return err(new AppError("Unauthorized", "AUTH_ERROR", 401));
  }

  try {
    // Get start of today for alerts count
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [activeSignals, totalPulses, alertsToday] = await Promise.all([
      // Count active signals
      prisma.signal.count({
        where: { userId: user.id, isActive: true },
      }),
      // Count total pulses for user's signals
      prisma.pulse.count({
        where: { signal: { userId: user.id } },
      }),
      // Count alerts sent today for user's signals
      prisma.alert.count({
        where: {
          pulse: { signal: { userId: user.id } },
          createdAt: { gte: today },
        },
      }),
    ]);

    return ok({
      activeSignals,
      totalPulses,
      alertsToday,
    });
  } catch (error) {
    console.error("[getDashboardStats] Error:", error);
    return err(
      new AppError("Failed to fetch dashboard stats", "FETCH_ERROR", 500, {
        originalError: error instanceof Error ? error.message : String(error),
      })
    );
  }
}

// Get recent activity (pulses and alerts)
export async function getRecentActivity(): Promise<Result<RecentActivityResult>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return err(new AppError("Unauthorized", "AUTH_ERROR", 401));
  }

  try {
    const [pulses, alerts] = await Promise.all([
      // Recent pulses
      prisma.pulse.findMany({
        where: { signal: { userId: user.id } },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          signal: {
            select: { id: true, name: true, url: true },
          },
        },
      }),
      // Recent alerts
      prisma.alert.findMany({
        where: { pulse: { signal: { userId: user.id } } },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: {
          pulse: {
            include: {
              signal: {
                select: { id: true, name: true },
              },
            },
          },
        },
      }),
    ]);

    return ok({ pulses, alerts });
  } catch (error) {
    console.error("[getRecentActivity] Error:", error);
    return err(
      new AppError("Failed to fetch recent activity", "FETCH_ERROR", 500, {
        originalError: error instanceof Error ? error.message : String(error),
      })
    );
  }
}
