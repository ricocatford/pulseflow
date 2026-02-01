import { describe, it, expect } from "vitest";
import { detectChanges } from "./changeDetector";
import { ChangeType, ComparableItem } from "../types";

describe("changeDetector", () => {
  const createItem = (
    id: string,
    title: string,
    content?: string
  ): ComparableItem => ({
    id,
    title,
    content,
  });

  describe("detectChanges", () => {
    describe("basic detection", () => {
      it("should detect no changes when items are identical", () => {
        const items = [
          createItem("1", "Item 1"),
          createItem("2", "Item 2"),
        ];

        const result = detectChanges({
          previous: items,
          current: items,
        });

        expect(result.hasChanges).toBe(false);
        expect(result.changeType).toBeNull();
        expect(result.summary).toBe("No changes detected");
        expect(result.details.added).toHaveLength(0);
        expect(result.details.removed).toHaveLength(0);
        expect(result.details.updated).toHaveLength(0);
      });

      it("should detect new items", () => {
        const previous = [createItem("1", "Item 1")];
        const current = [
          createItem("1", "Item 1"),
          createItem("2", "Item 2"),
        ];

        const result = detectChanges({ previous, current });

        expect(result.hasChanges).toBe(true);
        expect(result.changeType).toBe(ChangeType.NEW_ITEMS);
        expect(result.summary).toBe("1 new item detected");
        expect(result.details.added).toHaveLength(1);
        expect(result.details.added[0].id).toBe("2");
      });

      it("should detect multiple new items", () => {
        const previous = [createItem("1", "Item 1")];
        const current = [
          createItem("1", "Item 1"),
          createItem("2", "Item 2"),
          createItem("3", "Item 3"),
          createItem("4", "Item 4"),
        ];

        const result = detectChanges({ previous, current });

        expect(result.hasChanges).toBe(true);
        expect(result.changeType).toBe(ChangeType.NEW_ITEMS);
        expect(result.summary).toBe("3 new items detected");
        expect(result.details.added).toHaveLength(3);
        expect(result.details.stats.addedCount).toBe(3);
      });

      it("should handle empty previous (all items are new)", () => {
        const current = [
          createItem("1", "Item 1"),
          createItem("2", "Item 2"),
        ];

        const result = detectChanges({ previous: [], current });

        expect(result.hasChanges).toBe(true);
        expect(result.changeType).toBe(ChangeType.NEW_ITEMS);
        expect(result.details.added).toHaveLength(2);
        expect(result.details.stats.previousTotal).toBe(0);
        expect(result.details.stats.currentTotal).toBe(2);
      });

      it("should handle empty current", () => {
        const previous = [createItem("1", "Item 1")];

        const result = detectChanges({ previous, current: [] });

        expect(result.hasChanges).toBe(false);
        expect(result.details.removed).toHaveLength(0); // removals not detected by default
      });
    });

    describe("minNewItems threshold", () => {
      it("should respect minNewItems threshold", () => {
        const previous = [createItem("1", "Item 1")];
        const current = [
          createItem("1", "Item 1"),
          createItem("2", "Item 2"),
        ];

        const result = detectChanges({
          previous,
          current,
          minNewItems: 2,
        });

        expect(result.hasChanges).toBe(false);
        expect(result.details.added).toHaveLength(1); // Still tracked but not alerting
      });

      it("should trigger when threshold is met", () => {
        const previous = [createItem("1", "Item 1")];
        const current = [
          createItem("1", "Item 1"),
          createItem("2", "Item 2"),
          createItem("3", "Item 3"),
        ];

        const result = detectChanges({
          previous,
          current,
          minNewItems: 2,
        });

        expect(result.hasChanges).toBe(true);
        expect(result.details.added).toHaveLength(2);
      });

      it("should default minNewItems to 1", () => {
        const previous = [createItem("1", "Item 1")];
        const current = [
          createItem("1", "Item 1"),
          createItem("2", "Item 2"),
        ];

        const result = detectChanges({ previous, current });

        expect(result.hasChanges).toBe(true);
      });
    });

    describe("removal detection", () => {
      it("should not detect removals by default", () => {
        const previous = [
          createItem("1", "Item 1"),
          createItem("2", "Item 2"),
        ];
        const current = [createItem("1", "Item 1")];

        const result = detectChanges({ previous, current });

        expect(result.hasChanges).toBe(false);
        expect(result.details.removed).toHaveLength(0);
      });

      it("should detect removals when enabled", () => {
        const previous = [
          createItem("1", "Item 1"),
          createItem("2", "Item 2"),
        ];
        const current = [createItem("1", "Item 1")];

        const result = detectChanges({
          previous,
          current,
          detectRemovals: true,
        });

        expect(result.hasChanges).toBe(true);
        expect(result.changeType).toBe(ChangeType.REMOVED);
        expect(result.summary).toBe("1 item removed");
        expect(result.details.removed).toHaveLength(1);
        expect(result.details.removed[0].id).toBe("2");
      });

      it("should detect multiple removals", () => {
        const previous = [
          createItem("1", "Item 1"),
          createItem("2", "Item 2"),
          createItem("3", "Item 3"),
        ];
        const current = [createItem("1", "Item 1")];

        const result = detectChanges({
          previous,
          current,
          detectRemovals: true,
        });

        expect(result.summary).toBe("2 items removed");
        expect(result.details.removed).toHaveLength(2);
        expect(result.details.stats.removedCount).toBe(2);
      });
    });

    describe("update detection", () => {
      it("should not detect updates by default", () => {
        const previous = [createItem("1", "Item 1", "Content A")];
        const current = [createItem("1", "Item 1", "Content B")];

        const result = detectChanges({ previous, current });

        expect(result.hasChanges).toBe(false);
        expect(result.details.updated).toHaveLength(0);
      });

      it("should detect content updates when enabled", () => {
        const previous = [createItem("1", "Item 1", "Content A")];
        const current = [createItem("1", "Item 1", "Content B")];

        const result = detectChanges({
          previous,
          current,
          detectUpdates: true,
        });

        expect(result.hasChanges).toBe(true);
        expect(result.changeType).toBe(ChangeType.UPDATED);
        expect(result.summary).toBe("1 item updated");
        expect(result.details.updated).toHaveLength(1);
        expect(result.details.updated[0].previousContent).toBe("Content A");
        expect(result.details.updated[0].item.content).toBe("Content B");
      });

      it("should not flag identical content as updated", () => {
        const previous = [createItem("1", "Item 1", "Same content")];
        const current = [createItem("1", "Item 1", "Same content")];

        const result = detectChanges({
          previous,
          current,
          detectUpdates: true,
        });

        expect(result.hasChanges).toBe(false);
        expect(result.details.updated).toHaveLength(0);
      });

      it("should handle undefined content", () => {
        const previous = [createItem("1", "Item 1", undefined)];
        const current = [createItem("1", "Item 1", "New content")];

        const result = detectChanges({
          previous,
          current,
          detectUpdates: true,
        });

        expect(result.hasChanges).toBe(true);
        expect(result.details.updated).toHaveLength(1);
      });
    });

    describe("mixed changes", () => {
      it("should classify as MIXED when multiple change types occur", () => {
        const previous = [
          createItem("1", "Item 1"),
          createItem("2", "Item 2"),
        ];
        const current = [
          createItem("1", "Item 1"),
          createItem("3", "Item 3"),
        ];

        const result = detectChanges({
          previous,
          current,
          detectRemovals: true,
        });

        expect(result.hasChanges).toBe(true);
        expect(result.changeType).toBe(ChangeType.MIXED);
        expect(result.summary).toContain("1 new item detected");
        expect(result.summary).toContain("1 item removed");
        expect(result.details.added).toHaveLength(1);
        expect(result.details.removed).toHaveLength(1);
      });

      it("should handle all three change types together", () => {
        const previous = [
          createItem("1", "Item 1", "Content A"),
          createItem("2", "Item 2"),
        ];
        const current = [
          createItem("1", "Item 1", "Content B"), // Updated
          createItem("3", "Item 3"), // Added
          // Item 2 removed
        ];

        const result = detectChanges({
          previous,
          current,
          detectRemovals: true,
          detectUpdates: true,
        });

        expect(result.hasChanges).toBe(true);
        expect(result.changeType).toBe(ChangeType.MIXED);
        expect(result.details.added).toHaveLength(1);
        expect(result.details.removed).toHaveLength(1);
        expect(result.details.updated).toHaveLength(1);
      });
    });

    describe("stats calculation", () => {
      it("should calculate correct stats", () => {
        const previous = [
          createItem("1", "Item 1", "Old"),
          createItem("2", "Item 2"),
          createItem("3", "Item 3"),
        ];
        const current = [
          createItem("1", "Item 1", "New"),
          createItem("4", "Item 4"),
          createItem("5", "Item 5"),
        ];

        const result = detectChanges({
          previous,
          current,
          detectRemovals: true,
          detectUpdates: true,
        });

        expect(result.details.stats).toEqual({
          addedCount: 2,
          removedCount: 2,
          updatedCount: 1,
          previousTotal: 3,
          currentTotal: 3,
        });
      });
    });

    describe("edge cases", () => {
      it("should handle both empty arrays", () => {
        const result = detectChanges({ previous: [], current: [] });

        expect(result.hasChanges).toBe(false);
        expect(result.changeType).toBeNull();
        expect(result.summary).toBe("No changes detected");
      });

      it("should handle items with same id but different titles", () => {
        const previous = [createItem("1", "Old Title")];
        const current = [createItem("1", "New Title")];

        // Title changes without content are not detected as updates
        const result = detectChanges({
          previous,
          current,
          detectUpdates: true,
        });

        expect(result.hasChanges).toBe(false);
      });

      it("should handle duplicate IDs in current (last one wins in map)", () => {
        const previous: ComparableItem[] = [];
        const current = [
          createItem("1", "First"),
          createItem("1", "Second"),
        ];

        const result = detectChanges({ previous, current });

        // Both are considered new because they weren't in previous
        // But the map will only contain one entry
        expect(result.hasChanges).toBe(true);
        expect(result.details.added).toHaveLength(2);
      });
    });
  });
});
