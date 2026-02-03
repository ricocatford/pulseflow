"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { IconLoader2 } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createSignal, updateSignal } from "@/actions/signals";
import type { Signal, ScraperStrategy } from "@prisma/client";

interface SignalFormProps {
  signal?: Signal;
  onSuccess?: () => void;
}

interface FormState {
  error: string | null;
  success: boolean;
}

const strategies: { value: ScraperStrategy; label: string; description: string }[] = [
  { value: "AUTO", label: "Auto Detect", description: "Automatically detect content type" },
  { value: "RSS", label: "RSS Feed", description: "Parse RSS/Atom feeds" },
  { value: "REDDIT", label: "Reddit", description: "Monitor Reddit posts" },
  { value: "HACKERNEWS", label: "Hacker News", description: "Monitor HN stories" },
  { value: "HTML", label: "HTML Scraper", description: "Extract content via CSS selectors" },
];

const intervals = [
  { value: 15, label: "Every 15 minutes" },
  { value: 30, label: "Every 30 minutes" },
  { value: 60, label: "Every hour" },
  { value: 120, label: "Every 2 hours" },
  { value: 240, label: "Every 4 hours" },
];

export function SignalForm({ signal, onSuccess }: SignalFormProps) {
  const router = useRouter();
  const isEditing = !!signal;

  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (_prevState, formData) => {
      const name = formData.get("name") as string;
      const url = formData.get("url") as string;
      const selector = formData.get("selector") as string;
      const strategy = formData.get("strategy") as ScraperStrategy;
      const interval = parseInt(formData.get("interval") as string, 10);

      // Validation
      if (!name || name.length > 100) {
        return { error: "Name is required (max 100 characters)", success: false };
      }

      try {
        new URL(url);
      } catch {
        return { error: "Please enter a valid URL", success: false };
      }

      const result = isEditing
        ? await updateSignal({
            id: signal.id,
            name,
            url,
            selector: selector || null,
            strategy,
            interval,
          })
        : await createSignal({
            name,
            url,
            selector: selector || undefined,
            strategy,
            interval,
          });

      if (!result.success) {
        return { error: result.error.message, success: false };
      }

      router.refresh();
      onSuccess?.();
      return { error: null, success: true };
    },
    { error: null, success: false }
  );

  return (
    <form action={formAction} className="space-y-4">
      {state.error && (
        <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
          {state.error}
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="e.g., Competitor Pricing"
          defaultValue={signal?.name ?? ""}
          maxLength={100}
          required
        />
        <p className="text-xs text-muted-foreground">
          A descriptive name for this signal
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="url">URL</Label>
        <Input
          id="url"
          name="url"
          type="url"
          placeholder="https://example.com/page"
          defaultValue={signal?.url ?? ""}
          required
        />
        <p className="text-xs text-muted-foreground">
          The web page or feed to monitor
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="strategy">Strategy</Label>
        <Select name="strategy" defaultValue={signal?.strategy ?? "AUTO"}>
          <SelectTrigger id="strategy">
            <SelectValue placeholder="Select a strategy" />
          </SelectTrigger>
          <SelectContent>
            {strategies.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                <div className="flex flex-col">
                  <span>{s.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {s.description}
                  </span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="interval">Check Interval</Label>
        <Select
          name="interval"
          defaultValue={String(signal?.interval ?? 60)}
        >
          <SelectTrigger id="interval">
            <SelectValue placeholder="Select interval" />
          </SelectTrigger>
          <SelectContent>
            {intervals.map((i) => (
              <SelectItem key={i.value} value={String(i.value)}>
                {i.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="selector">CSS Selector (Optional)</Label>
        <Textarea
          id="selector"
          name="selector"
          placeholder=".article-content, #main-content"
          defaultValue={signal?.selector ?? ""}
          rows={2}
        />
        <p className="text-xs text-muted-foreground">
          Target specific content with CSS selectors (for HTML strategy)
        </p>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="submit" disabled={isPending}>
          {isPending && <IconLoader2 className="h-4 w-4 animate-spin" />}
          {isEditing ? "Update Signal" : "Create Signal"}
        </Button>
      </div>
    </form>
  );
}
