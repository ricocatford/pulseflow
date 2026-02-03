import { IconPlus } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { StatsCards } from "@/components/features/dashboard/StatsCards";
import { RecentActivity } from "@/components/features/dashboard/RecentActivity";
import { SignalFormDialog } from "@/components/features/signals/SignalFormDialog";

export default async function DashboardPage() {
  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Monitor your web signals and alerts
          </p>
        </div>
        <SignalFormDialog>
          <Button>
            <IconPlus className="h-4 w-4" />
            New Signal
          </Button>
        </SignalFormDialog>
      </div>

      <StatsCards />

      <div className="mt-8">
        <RecentActivity />
      </div>
    </>
  );
}
