import { ComparableItem, ChangeType, EmailAlertData } from "../types";

/**
 * Get change type display text
 */
function getChangeTypeLabel(changeType: ChangeType): string {
  switch (changeType) {
    case ChangeType.NEW_ITEMS:
      return "New Items Detected";
    case ChangeType.REMOVED:
      return "Items Removed";
    case ChangeType.UPDATED:
      return "Items Updated";
    case ChangeType.MIXED:
      return "Multiple Changes Detected";
    default:
      return "Changes Detected";
  }
}

/**
 * Format item for display
 */
function formatItem(item: ComparableItem): string {
  const url = item.url ?? item.id;
  return `<li style="margin-bottom: 8px;">
    <a href="${escapeHtml(url)}" style="color: #2563eb; text-decoration: none;">
      ${escapeHtml(item.title)}
    </a>
    ${item.author ? `<br><span style="color: #6b7280; font-size: 12px;">by ${escapeHtml(item.author)}</span>` : ""}
  </li>`;
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Generate HTML email template for alert
 */
export function generateAlertEmailHtml(data: EmailAlertData): string {
  const { signalName, signalUrl, changeSummary, changeType, items } = data;
  const changeLabel = getChangeTypeLabel(changeType);

  const addedSection =
    items.added.length > 0
      ? `
    <div style="margin-bottom: 24px;">
      <h3 style="color: #16a34a; margin: 0 0 12px 0; font-size: 16px;">
        New Items (${items.added.length})
      </h3>
      <ul style="margin: 0; padding-left: 20px; list-style-type: disc;">
        ${items.added.map(formatItem).join("")}
      </ul>
    </div>
  `
      : "";

  const removedSection =
    items.removed.length > 0
      ? `
    <div style="margin-bottom: 24px;">
      <h3 style="color: #dc2626; margin: 0 0 12px 0; font-size: 16px;">
        Removed Items (${items.removed.length})
      </h3>
      <ul style="margin: 0; padding-left: 20px; list-style-type: disc;">
        ${items.removed.map(formatItem).join("")}
      </ul>
    </div>
  `
      : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(changeLabel)} - ${escapeHtml(signalName)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">PulseFlow Alert</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0 0;">${escapeHtml(changeLabel)}</p>
  </div>

  <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
    <div style="background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; border: 1px solid #e5e7eb;">
      <h2 style="margin: 0 0 8px 0; font-size: 18px; color: #111827;">
        <a href="${escapeHtml(signalUrl)}" style="color: #111827; text-decoration: none;">
          ${escapeHtml(signalName)}
        </a>
      </h2>
      <p style="margin: 0; color: #6b7280; font-size: 14px;">
        ${escapeHtml(changeSummary)}
      </p>
    </div>

    ${addedSection}
    ${removedSection}

    <div style="border-top: 1px solid #e5e7eb; padding-top: 16px; margin-top: 24px;">
      <a href="${escapeHtml(signalUrl)}"
         style="display: inline-block; background: #6366f1; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 500;">
        View Signal
      </a>
    </div>
  </div>

  <div style="text-align: center; padding: 16px; color: #9ca3af; font-size: 12px;">
    <p style="margin: 0;">
      You're receiving this because you set up an alert for "${escapeHtml(signalName)}"
    </p>
    <p style="margin: 8px 0 0 0;">
      Powered by <a href="https://pulseflow.dev" style="color: #6366f1;">PulseFlow</a>
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email for alert
 */
export function generateAlertEmailText(data: EmailAlertData): string {
  const { signalName, signalUrl, changeSummary, changeType, items } = data;
  const changeLabel = getChangeTypeLabel(changeType);

  const lines: string[] = [
    `PulseFlow Alert: ${changeLabel}`,
    "=".repeat(40),
    "",
    `Signal: ${signalName}`,
    `URL: ${signalUrl}`,
    "",
    changeSummary,
    "",
  ];

  if (items.added.length > 0) {
    lines.push(`New Items (${items.added.length}):`);
    lines.push("-".repeat(20));
    items.added.forEach((item) => {
      lines.push(`- ${item.title}`);
      lines.push(`  ${item.url ?? item.id}`);
      if (item.author) {
        lines.push(`  by ${item.author}`);
      }
    });
    lines.push("");
  }

  if (items.removed.length > 0) {
    lines.push(`Removed Items (${items.removed.length}):`);
    lines.push("-".repeat(20));
    items.removed.forEach((item) => {
      lines.push(`- ${item.title}`);
      lines.push(`  ${item.url ?? item.id}`);
    });
    lines.push("");
  }

  lines.push("-".repeat(40));
  lines.push(`View signal: ${signalUrl}`);
  lines.push("");
  lines.push("Powered by PulseFlow - https://pulseflow.dev");

  return lines.join("\n");
}

/**
 * Generate email subject
 */
export function generateAlertEmailSubject(data: EmailAlertData): string {
  const { signalName, changeType, items } = data;
  const changeLabel = getChangeTypeLabel(changeType);

  if (changeType === ChangeType.NEW_ITEMS && items.added.length > 0) {
    return `[PulseFlow] ${items.added.length} new item${items.added.length === 1 ? "" : "s"} - ${signalName}`;
  }

  return `[PulseFlow] ${changeLabel} - ${signalName}`;
}
