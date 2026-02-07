import Link from "next/link";
import type { Route } from "next";
import {
  IconActivity,
  IconBell,
  IconCheck,
  IconX,
  IconPlus,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRecentActivity } from "@/actions/dashboard";
import { SignalFormDialog } from "@/components/features/signals/SignalFormDialog";
import { RelativeTime } from "@/components/features/dashboard/RelativeTime";

export async function RecentActivity() {
  const result = await getRecentActivity();

  if (!result.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-destructive">Failed to load activity</p>
        </CardContent>
      </Card>
    );
  }

  const { pulses, alerts } = result.data;

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      {/* Recent Pulses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconActivity className="h-5 w-5" />
            Recent Pulses
          </CardTitle>
          <CardDescription>Latest data collection events</CardDescription>
        </CardHeader>
        <CardContent>
          {pulses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <IconActivity className="h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No pulses yet. Create a signal to start collecting data.
              </p>
              <SignalFormDialog>
                <Button variant="outline" size="sm" className="mt-4">
                  <IconPlus className="h-4 w-4" />
                  Create Signal
                </Button>
              </SignalFormDialog>
            </div>
          ) : (
            <div className="space-y-4">
              {pulses.map((pulse) => (
                <div
                  key={pulse.id}
                  className="flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    {pulse.status === "SUCCESS" ? (
                      <IconCheck className="mt-0.5 h-4 w-4 text-green-500" />
                    ) : (
                      <IconX className="mt-0.5 h-4 w-4 text-destructive" />
                    )}
                    <div>
                      <Link
                        href={`/dashboard/signals/${pulse.signal.id}` as Route}
                        className="font-medium hover:underline"
                      >
                        {pulse.signal.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {pulse.summary
                          ? pulse.summary.slice(0, 60) + "..."
                          : "No summary"}
                      </p>
                    </div>
                  </div>
                  <RelativeTime
                    date={pulse.createdAt}
                    className="text-xs text-muted-foreground whitespace-nowrap"
                  />
                </div>
              ))}
              <Link
                href={"/dashboard/signals" as Route}
                className="block text-center text-sm text-muted-foreground hover:text-foreground"
              >
                View all signals
              </Link>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <IconBell className="h-5 w-5" />
            Recent Alerts
          </CardTitle>
          <CardDescription>Latest triggered notifications</CardDescription>
        </CardHeader>
        <CardContent>
          {alerts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <IconBell className="h-10 w-10 text-muted-foreground" />
              <p className="mt-2 text-sm text-muted-foreground">
                No alerts yet. Alerts trigger when changes are detected.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start justify-between gap-4"
                >
                  <div className="flex items-start gap-3">
                    <Badge
                      variant={alert.status === "SENT" ? "default" : "destructive"}
                      className="mt-0.5"
                    >
                      {alert.status}
                    </Badge>
                    <div>
                      <Link
                        href={`/dashboard/signals/${alert.pulse.signal.id}` as Route}
                        className="font-medium hover:underline"
                      >
                        {alert.pulse.signal.name}
                      </Link>
                      <p className="text-sm text-muted-foreground">
                        {alert.changeSummary.slice(0, 60)}...
                      </p>
                    </div>
                  </div>
                  <RelativeTime
                    date={alert.createdAt}
                    className="text-xs text-muted-foreground whitespace-nowrap"
                  />
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
