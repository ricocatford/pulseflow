"use client";

import { useState } from "react";
import { IconMinus, IconPlus, IconEqual } from "@tabler/icons-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PulseItem {
  title: string;
  url: string;
  content?: string;
  author?: string;
}

interface PulseDiffViewProps {
  currentData: string;
  previousData: string | null;
}

function parseItems(data: string): PulseItem[] {
  try {
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function computeDiff(current: PulseItem[], previous: PulseItem[]) {
  const previousUrls = new Set(previous.map((item) => item.url));
  const currentUrls = new Set(current.map((item) => item.url));

  const added = current.filter((item) => !previousUrls.has(item.url));
  const removed = previous.filter((item) => !currentUrls.has(item.url));
  const unchanged = current.filter((item) => previousUrls.has(item.url));

  return { added, removed, unchanged };
}

function ItemCard({
  item,
  type,
}: {
  item: PulseItem;
  type: "added" | "removed" | "unchanged";
}) {
  const bgColor = {
    added: "bg-green-500/10 border-green-500/20",
    removed: "bg-red-500/10 border-red-500/20",
    unchanged: "bg-muted/50",
  };

  const Icon = {
    added: IconPlus,
    removed: IconMinus,
    unchanged: IconEqual,
  }[type];

  return (
    <div className={`rounded-lg border p-3 ${bgColor[type]}`}>
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 shrink-0" />
        <div className="min-w-0 flex-1">
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:underline"
          >
            {item.title}
          </a>
          {item.author && (
            <p className="mt-1 text-xs text-muted-foreground">
              by {item.author}
            </p>
          )}
          {item.content && (
            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
              {item.content}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function PulseDiffView({
  currentData,
  previousData,
}: PulseDiffViewProps) {
  const [activeTab, setActiveTab] = useState("diff");

  const currentItems = parseItems(currentData);
  const previousItems = previousData ? parseItems(previousData) : [];

  const { added, removed, unchanged } = computeDiff(
    currentItems,
    previousItems
  );

  const hasChanges = added.length > 0 || removed.length > 0;

  if (currentItems.length === 0) {
    return (
      <div className="rounded-lg bg-muted/50 p-4 text-center text-muted-foreground">
        No items found in this pulse
      </div>
    );
  }

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList>
        <TabsTrigger value="diff">
          Changes
          {hasChanges && (
            <Badge variant="secondary" className="ml-2">
              {added.length + removed.length}
            </Badge>
          )}
        </TabsTrigger>
        <TabsTrigger value="all">
          All Items
          <Badge variant="secondary" className="ml-2">
            {currentItems.length}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="raw">Raw Data</TabsTrigger>
      </TabsList>

      <TabsContent value="diff" className="mt-4 space-y-4">
        {!previousData ? (
          <div className="rounded-lg bg-muted/50 p-4 text-center text-muted-foreground">
            This is the first pulse - no previous data to compare
          </div>
        ) : !hasChanges ? (
          <div className="rounded-lg bg-muted/50 p-4 text-center text-muted-foreground">
            No changes detected from previous pulse
          </div>
        ) : (
          <>
            {added.length > 0 && (
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-green-600">
                  <IconPlus className="h-4 w-4" />
                  Added ({added.length})
                </h3>
                <div className="space-y-2">
                  {added.map((item, i) => (
                    <ItemCard key={i} item={item} type="added" />
                  ))}
                </div>
              </div>
            )}

            {removed.length > 0 && (
              <div>
                <h3 className="mb-2 flex items-center gap-2 text-sm font-medium text-red-600">
                  <IconMinus className="h-4 w-4" />
                  Removed ({removed.length})
                </h3>
                <div className="space-y-2">
                  {removed.map((item, i) => (
                    <ItemCard key={i} item={item} type="removed" />
                  ))}
                </div>
              </div>
            )}

            {unchanged.length > 0 && (
              <details className="mt-4">
                <summary className="cursor-pointer text-sm text-muted-foreground hover:text-foreground">
                  Show unchanged items ({unchanged.length})
                </summary>
                <div className="mt-2 space-y-2">
                  {unchanged.map((item, i) => (
                    <ItemCard key={i} item={item} type="unchanged" />
                  ))}
                </div>
              </details>
            )}
          </>
        )}
      </TabsContent>

      <TabsContent value="all" className="mt-4">
        <div className="space-y-2">
          {currentItems.map((item, i) => (
            <ItemCard
              key={i}
              item={item}
              type={
                previousData && !previousItems.some((p) => p.url === item.url)
                  ? "added"
                  : "unchanged"
              }
            />
          ))}
        </div>
      </TabsContent>

      <TabsContent value="raw" className="mt-4">
        <pre className="max-h-96 overflow-auto rounded-lg bg-muted p-4 text-sm">
          {JSON.stringify(currentItems, null, 2)}
        </pre>
      </TabsContent>
    </Tabs>
  );
}
