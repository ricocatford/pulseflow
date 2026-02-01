import { Result } from "@/lib/errors";

/**
 * Alert channel types matching Prisma enum
 */
export enum AlertChannel {
  EMAIL = "EMAIL",
  WEBHOOK = "WEBHOOK",
}

/**
 * Alert delivery status matching Prisma enum
 */
export enum AlertStatus {
  PENDING = "PENDING",
  SENT = "SENT",
  FAILED = "FAILED",
}

/**
 * Change type classification matching Prisma enum
 */
export enum ChangeType {
  NEW_ITEMS = "NEW_ITEMS",
  REMOVED = "REMOVED",
  UPDATED = "UPDATED",
  MIXED = "MIXED",
}

/**
 * A comparable item from scrape results
 */
export interface ComparableItem {
  /** Unique identifier (usually URL) */
  id: string;
  /** Item title */
  title: string;
  /** Optional content for update detection */
  content?: string;
  /** Optional URL if different from id */
  url?: string;
  /** Optional author */
  author?: string;
}

/**
 * Statistics about detected changes
 */
export interface ChangeStats {
  addedCount: number;
  removedCount: number;
  updatedCount: number;
  previousTotal: number;
  currentTotal: number;
}

/**
 * Detailed breakdown of changes
 */
export interface ChangeDetails {
  added: ComparableItem[];
  removed: ComparableItem[];
  updated: Array<{
    item: ComparableItem;
    previousContent?: string;
  }>;
  stats: ChangeStats;
}

/**
 * Result of change detection
 */
export interface ChangeDetectionResult {
  /** Whether meaningful changes were detected */
  hasChanges: boolean;
  /** Classification of the change type */
  changeType: ChangeType | null;
  /** Human-readable summary of changes */
  summary: string;
  /** Detailed breakdown of all changes */
  details: ChangeDetails;
}

/**
 * Options for change detection
 */
export interface ChangeDetectionOptions {
  /** Previous scrape items */
  previous: ComparableItem[];
  /** Current scrape items */
  current: ComparableItem[];
  /** Minimum new items to trigger alert (default: 1) */
  minNewItems?: number;
  /** Whether to detect item removals (default: false) */
  detectRemovals?: boolean;
  /** Whether to detect content updates (default: false) */
  detectUpdates?: boolean;
}

/**
 * Options for sending an alert
 */
export interface AlertOptions {
  /** Destination (email or webhook URL) */
  destination: string;
  /** Signal information */
  signal: {
    id: string;
    name: string;
    url: string;
  };
  /** Change detection result */
  change: ChangeDetectionResult;
  /** Pulse ID for reference */
  pulseId: string;
  /** If true, logs actions without sending */
  dryRun?: boolean;
}

/**
 * Result of alert delivery
 */
export interface AlertDeliveryResult {
  /** Whether delivery succeeded */
  success: boolean;
  /** Channel used for delivery */
  channel: AlertChannel;
  /** Destination address */
  destination: string;
  /** Timestamp of delivery */
  deliveredAt: Date;
  /** Whether this was a dry run */
  dryRun: boolean;
  /** Error message if delivery failed */
  errorMessage?: string;
}

/**
 * Alert provider interface
 */
export interface IAlertProvider {
  /** Provider channel type */
  readonly channel: AlertChannel;
  /** Send an alert notification */
  send(options: AlertOptions): Promise<Result<AlertDeliveryResult>>;
  /** Validate destination format */
  validateDestination(destination: string): boolean;
}

/**
 * Configuration for creating an alert provider
 */
export interface AlertProviderConfig {
  /** Channel type */
  channel: AlertChannel;
  /** Maximum retry attempts (default: 3) */
  maxRetries?: number;
  /** Validate destination function */
  validateDestinationFn: (destination: string) => boolean;
  /** Send function implementation */
  sendFn: (options: AlertOptions) => Promise<Result<AlertDeliveryResult>>;
}

/**
 * Webhook payload structure
 */
export interface WebhookPayload {
  event: "pulse.change_detected";
  timestamp: string;
  signal: {
    id: string;
    name: string;
    url: string;
  };
  change: {
    type: ChangeType;
    summary: string;
    stats: ChangeStats;
    items: {
      added: ComparableItem[];
      removed: ComparableItem[];
      updated: Array<{ item: ComparableItem; previousContent?: string }>;
    };
  };
  pulseId: string;
}

/**
 * Email alert data
 */
export interface EmailAlertData {
  to: string;
  signalName: string;
  signalUrl: string;
  changeSummary: string;
  changeType: ChangeType;
  items: {
    added: ComparableItem[];
    removed: ComparableItem[];
  };
  pulseId: string;
}
