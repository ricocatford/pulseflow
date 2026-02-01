import {
  ChangeDetectionOptions,
  ChangeDetectionResult,
  ChangeDetails,
  ChangeStats,
  ChangeType,
  ComparableItem,
} from "../types";
import {
  DEFAULT_MIN_NEW_ITEMS,
  DEFAULT_DETECT_REMOVALS,
  DEFAULT_DETECT_UPDATES,
} from "../constants";

/**
 * Classify the type of change based on what was detected
 */
function classifyChangeType(
  addedCount: number,
  removedCount: number,
  updatedCount: number
): ChangeType | null {
  const hasAdded = addedCount > 0;
  const hasRemoved = removedCount > 0;
  const hasUpdated = updatedCount > 0;

  // No changes
  if (!hasAdded && !hasRemoved && !hasUpdated) {
    return null;
  }

  // Multiple change types
  const changeCount = [hasAdded, hasRemoved, hasUpdated].filter(Boolean).length;
  if (changeCount > 1) {
    return ChangeType.MIXED;
  }

  // Single change type
  if (hasAdded) return ChangeType.NEW_ITEMS;
  if (hasRemoved) return ChangeType.REMOVED;
  if (hasUpdated) return ChangeType.UPDATED;

  return null;
}

/**
 * Generate a human-readable summary of changes
 */
function generateSummary(
  added: ComparableItem[],
  removed: ComparableItem[],
  updated: Array<{ item: ComparableItem; previousContent?: string }>
): string {
  const parts: string[] = [];

  if (added.length > 0) {
    parts.push(`${added.length} new item${added.length === 1 ? "" : "s"} detected`);
  }

  if (removed.length > 0) {
    parts.push(`${removed.length} item${removed.length === 1 ? "" : "s"} removed`);
  }

  if (updated.length > 0) {
    parts.push(`${updated.length} item${updated.length === 1 ? "" : "s"} updated`);
  }

  if (parts.length === 0) {
    return "No changes detected";
  }

  return parts.join(", ");
}

/**
 * Find items that exist in both sets but have different content
 */
function findUpdatedItems(
  current: ComparableItem[],
  previousMap: Map<string, ComparableItem>
): Array<{ item: ComparableItem; previousContent?: string }> {
  const updated: Array<{ item: ComparableItem; previousContent?: string }> = [];

  for (const item of current) {
    const previousItem = previousMap.get(item.id);
    if (previousItem && previousItem.content !== item.content) {
      updated.push({
        item,
        previousContent: previousItem.content,
      });
    }
  }

  return updated;
}

/**
 * Detect changes between two sets of scraped items
 *
 * @param options - Change detection configuration
 * @returns Detection result with changes breakdown
 */
export function detectChanges(
  options: ChangeDetectionOptions
): ChangeDetectionResult {
  const {
    previous,
    current,
    minNewItems = DEFAULT_MIN_NEW_ITEMS,
    detectRemovals = DEFAULT_DETECT_REMOVALS,
    detectUpdates = DEFAULT_DETECT_UPDATES,
  } = options;

  // Build maps for O(1) lookup
  const previousMap = new Map<string, ComparableItem>(
    previous.map((item) => [item.id, item])
  );
  const currentMap = new Map<string, ComparableItem>(
    current.map((item) => [item.id, item])
  );

  // Find added items (in current, not in previous)
  const added = current.filter((item) => !previousMap.has(item.id));

  // Find removed items (in previous, not in current) - opt-in
  const removed = detectRemovals
    ? previous.filter((item) => !currentMap.has(item.id))
    : [];

  // Find updated items (content changed) - opt-in
  const updated = detectUpdates ? findUpdatedItems(current, previousMap) : [];

  // Calculate stats
  const stats: ChangeStats = {
    addedCount: added.length,
    removedCount: removed.length,
    updatedCount: updated.length,
    previousTotal: previous.length,
    currentTotal: current.length,
  };

  // Build details
  const details: ChangeDetails = {
    added,
    removed,
    updated,
    stats,
  };

  // Determine if changes meet threshold
  const meetsNewItemsThreshold = added.length >= minNewItems;
  const hasRemovals = detectRemovals && removed.length > 0;
  const hasUpdates = detectUpdates && updated.length > 0;
  const hasChanges = meetsNewItemsThreshold || hasRemovals || hasUpdates;

  // Classify change type
  const changeType = hasChanges
    ? classifyChangeType(
        meetsNewItemsThreshold ? added.length : 0,
        hasRemovals ? removed.length : 0,
        hasUpdates ? updated.length : 0
      )
    : null;

  // Generate summary
  const summary = generateSummary(
    meetsNewItemsThreshold ? added : [],
    hasRemovals ? removed : [],
    hasUpdates ? updated : []
  );

  return {
    hasChanges,
    changeType,
    summary,
    details,
  };
}
