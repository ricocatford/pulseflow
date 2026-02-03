"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { inngest } from "@/inngest/client";
import { AppError, err, ok, Result } from "@/lib/errors";
import type { Signal, Pulse, ScraperStrategy, Prisma } from "@prisma/client";

// Input types
interface CreateSignalInput {
  name: string;
  url: string;
  selector?: string;
  strategy: ScraperStrategy;
  interval: number;
}

interface UpdateSignalInput {
  id: string;
  name?: string;
  url?: string;
  selector?: string | null;
  strategy?: ScraperStrategy;
  interval?: number;
  isActive?: boolean;
}

interface GetSignalsFilters {
  search?: string;
  status?: "all" | "active" | "inactive";
  page?: number;
  limit?: number;
}

interface SignalsListResult {
  signals: Signal[];
  total: number;
  page: number;
  totalPages: number;
}

interface SignalWithPulses extends Signal {
  pulses: Pulse[];
  _count: {
    pulses: number;
  };
}

// Auth helper
async function getAuthenticatedUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user;
}

// Create a new signal
export async function createSignal(
  input: CreateSignalInput
): Promise<Result<Signal>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return err(new AppError("Unauthorized", "AUTH_ERROR", 401));
  }

  try {
    const signal = await prisma.signal.create({
      data: {
        name: input.name,
        url: input.url,
        selector: input.selector ?? null,
        strategy: input.strategy,
        interval: input.interval,
        userId: user.id,
        isActive: true,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/signals");

    return ok(signal);
  } catch (error) {
    console.error("[createSignal] Error:", error);
    return err(
      new AppError("Failed to create signal", "CREATE_ERROR", 500, {
        originalError: error instanceof Error ? error.message : String(error),
      })
    );
  }
}

// Update an existing signal
export async function updateSignal(
  input: UpdateSignalInput
): Promise<Result<Signal>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return err(new AppError("Unauthorized", "AUTH_ERROR", 401));
  }

  try {
    // Verify ownership
    const existing = await prisma.signal.findFirst({
      where: { id: input.id, userId: user.id },
    });

    if (!existing) {
      return err(new AppError("Signal not found", "NOT_FOUND", 404));
    }

    const { id, ...updateData } = input;
    const signal = await prisma.signal.update({
      where: { id },
      data: updateData,
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/signals");
    revalidatePath(`/dashboard/signals/${id}`);

    return ok(signal);
  } catch (error) {
    console.error("[updateSignal] Error:", error);
    return err(
      new AppError("Failed to update signal", "UPDATE_ERROR", 500, {
        originalError: error instanceof Error ? error.message : String(error),
      })
    );
  }
}

// Delete a signal
export async function deleteSignal(id: string): Promise<Result<{ id: string }>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return err(new AppError("Unauthorized", "AUTH_ERROR", 401));
  }

  try {
    // Verify ownership
    const existing = await prisma.signal.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return err(new AppError("Signal not found", "NOT_FOUND", 404));
    }

    // Delete related records first (pulses, alerts, destinations)
    await prisma.$transaction([
      prisma.alert.deleteMany({
        where: { pulse: { signalId: id } },
      }),
      prisma.pulse.deleteMany({
        where: { signalId: id },
      }),
      prisma.alertDestination.deleteMany({
        where: { signalId: id },
      }),
      prisma.signal.delete({
        where: { id },
      }),
    ]);

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/signals");

    return ok({ id });
  } catch (error) {
    console.error("[deleteSignal] Error:", error);
    return err(
      new AppError("Failed to delete signal", "DELETE_ERROR", 500, {
        originalError: error instanceof Error ? error.message : String(error),
      })
    );
  }
}

// Toggle signal active status
export async function toggleSignalActive(
  id: string,
  isActive: boolean
): Promise<Result<Signal>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return err(new AppError("Unauthorized", "AUTH_ERROR", 401));
  }

  try {
    // Verify ownership
    const existing = await prisma.signal.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return err(new AppError("Signal not found", "NOT_FOUND", 404));
    }

    const signal = await prisma.signal.update({
      where: { id },
      data: { isActive },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/signals");
    revalidatePath(`/dashboard/signals/${id}`);

    return ok(signal);
  } catch (error) {
    console.error("[toggleSignalActive] Error:", error);
    return err(
      new AppError("Failed to toggle signal status", "UPDATE_ERROR", 500, {
        originalError: error instanceof Error ? error.message : String(error),
      })
    );
  }
}

// Trigger a manual scrape via Inngest
export async function triggerSignalScrape(
  id: string
): Promise<Result<{ eventId: string }>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return err(new AppError("Unauthorized", "AUTH_ERROR", 401));
  }

  try {
    // Verify ownership
    const existing = await prisma.signal.findFirst({
      where: { id, userId: user.id },
    });

    if (!existing) {
      return err(new AppError("Signal not found", "NOT_FOUND", 404));
    }

    const { ids } = await inngest.send({
      name: "signal/scrape.requested",
      data: { signalId: id },
    });

    return ok({ eventId: ids[0] });
  } catch (error) {
    console.error("[triggerSignalScrape] Error:", error);
    return err(
      new AppError("Failed to trigger scrape", "TRIGGER_ERROR", 500, {
        originalError: error instanceof Error ? error.message : String(error),
      })
    );
  }
}

// Get signals list with filters and pagination
export async function getSignals(
  filters: GetSignalsFilters = {}
): Promise<Result<SignalsListResult>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return err(new AppError("Unauthorized", "AUTH_ERROR", 401));
  }

  const { search = "", status = "all", page = 1, limit = 10 } = filters;

  try {
    const where: Prisma.SignalWhereInput = {
      userId: user.id,
    };

    // Search filter
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { url: { contains: search, mode: "insensitive" } },
      ];
    }

    // Status filter
    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    }

    const [signals, total] = await Promise.all([
      prisma.signal.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.signal.count({ where }),
    ]);

    return ok({
      signals,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    console.error("[getSignals] Error:", error);
    return err(
      new AppError("Failed to fetch signals", "FETCH_ERROR", 500, {
        originalError: error instanceof Error ? error.message : String(error),
      })
    );
  }
}

// Get a single signal by ID with pulses
export async function getSignalById(
  id: string
): Promise<Result<SignalWithPulses>> {
  const user = await getAuthenticatedUser();
  if (!user) {
    return err(new AppError("Unauthorized", "AUTH_ERROR", 401));
  }

  try {
    const signal = await prisma.signal.findFirst({
      where: { id, userId: user.id },
      include: {
        pulses: {
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: {
          select: { pulses: true },
        },
      },
    });

    if (!signal) {
      return err(new AppError("Signal not found", "NOT_FOUND", 404));
    }

    return ok(signal);
  } catch (error) {
    console.error("[getSignalById] Error:", error);
    return err(
      new AppError("Failed to fetch signal", "FETCH_ERROR", 500, {
        originalError: error instanceof Error ? error.message : String(error),
      })
    );
  }
}
