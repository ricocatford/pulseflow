import { IconRadar, IconWaveSine, IconBell } from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboardStats } from "@/actions/dashboard";

export async function StatsCards() {
  const result = await getDashboardStats();

  if (!result.success) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader>
              <CardTitle className="text-muted-foreground">Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-destructive">Failed to load</p>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const { activeSignals, totalPulses, alertsToday } = result.data;

  const stats = [
    {
      title: "Active Signals",
      description: "Currently monitoring",
      value: activeSignals,
      icon: IconRadar,
    },
    {
      title: "Total Pulses",
      description: "Data points collected",
      value: totalPulses,
      icon: IconWaveSine,
    },
    {
      title: "Alerts Today",
      description: "Triggered notifications",
      value: alertsToday,
      icon: IconBell,
    },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {stats.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="text-sm font-medium">
                {stat.title}
              </CardTitle>
              <CardDescription>{stat.description}</CardDescription>
            </div>
            <stat.icon className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stat.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
