"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import type { Route } from "next";
import { useRouter } from "next/navigation";
import {
  IconDotsVertical,
  IconEdit,
  IconPlayerPlay,
  IconToggleLeft,
  IconToggleRight,
  IconTrash,
  IconExternalLink,
} from "@tabler/icons-react";
import { usePollingRefresh } from "@/hooks/usePollingRefresh";
import { useRelativeTime } from "@/hooks/useRelativeTime";
import { RelativeTime } from "@/components/features/dashboard/RelativeTime";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { SignalStatusBadge } from "./SignalStatusBadge";
import { StrategyBadge } from "./StrategyBadge";
import { SignalFormDialog } from "./SignalFormDialog";
import {
  deleteSignal,
  toggleSignalActive,
  triggerSignalScrape,
} from "@/actions/signals";
import type { Signal } from "@prisma/client";

interface SignalTableProps {
  signals: Signal[];
}

function formatInterval(minutes: number): string {
  if (minutes < 60) return `Every ${minutes} mins`;
  const hours = minutes / 60;
  return `Every ${hours}h`;
}

function truncateUrl(url: string, maxLength = 40): string {
  if (url.length <= maxLength) return url;
  return url.slice(0, maxLength) + "...";
}

export function SignalTable({ signals }: SignalTableProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [editingSignal, setEditingSignal] = useState<Signal | null>(null);
  const { startPolling } = usePollingRefresh();
  useRelativeTime();

  const handleToggle = (id: string, currentStatus: boolean) => {
    startTransition(async () => {
      await toggleSignalActive(id, !currentStatus);
      router.refresh();
    });
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this signal?")) return;
    startTransition(async () => {
      await deleteSignal(id);
      router.refresh();
    });
  };

  const handleTrigger = (id: string) => {
    startTransition(async () => {
      await triggerSignalScrape(id);
      router.refresh();
      startPolling();
    });
  };

  if (signals.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <p className="text-muted-foreground">No signals found.</p>
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead className="hidden md:table-cell">URL</TableHead>
            <TableHead>Strategy</TableHead>
            <TableHead className="hidden sm:table-cell">Interval</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="hidden lg:table-cell">Last Scraped</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {signals.map((signal) => (
            <TableRow key={signal.id}>
              <TableCell>
                <Link
                  href={`/dashboard/signals/${signal.id}` as Route}
                  className="font-medium hover:underline"
                >
                  {signal.name}
                </Link>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <a
                  href={signal.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-muted-foreground hover:text-foreground"
                >
                  {truncateUrl(signal.url)}
                  <IconExternalLink className="h-3 w-3" />
                </a>
              </TableCell>
              <TableCell>
                <StrategyBadge strategy={signal.strategy} />
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                {formatInterval(signal.interval)}
              </TableCell>
              <TableCell>
                <SignalStatusBadge isActive={signal.isActive} />
              </TableCell>
              <TableCell className="hidden lg:table-cell text-muted-foreground">
                <RelativeTime date={signal.lastScrapedAt} />
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      disabled={isPending}
                    >
                      <IconDotsVertical className="h-4 w-4" />
                      <span className="sr-only">Actions</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditingSignal(signal)}>
                      <IconEdit className="h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleTrigger(signal.id)}>
                      <IconPlayerPlay className="h-4 w-4" />
                      Trigger Scrape
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={() => handleToggle(signal.id, signal.isActive)}
                    >
                      {signal.isActive ? (
                        <>
                          <IconToggleLeft className="h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <IconToggleRight className="h-4 w-4" />
                          Activate
                        </>
                      )}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => handleDelete(signal.id)}
                      className="text-destructive focus:text-destructive"
                    >
                      <IconTrash className="h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingSignal && (
        <SignalFormDialog
          signal={editingSignal}
          open={!!editingSignal}
          onOpenChange={(open) => !open && setEditingSignal(null)}
        />
      )}
    </>
  );
}
