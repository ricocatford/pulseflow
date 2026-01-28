import { redirect } from "next/navigation";
import { IconActivity, IconPlus } from "@tabler/icons-react";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { UserMenu } from "@/components/features/UserMenu";

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <IconActivity className="h-6 w-6" />
            <span className="text-xl font-semibold">PulseFlow</span>
          </div>
          <UserMenu email={user.email ?? ""} />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Dashboard</h1>
            <p className="text-muted-foreground">
              Monitor your web signals and alerts
            </p>
          </div>
          <Button>
            <IconPlus className="h-4 w-4" />
            New Signal
          </Button>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Active Signals</CardTitle>
              <CardDescription>Currently monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Total Pulses</CardTitle>
              <CardDescription>Data points collected</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">0</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alerts Today</CardTitle>
              <CardDescription>Triggered notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold">0</p>
            </CardContent>
          </Card>
        </div>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Your Signals</CardTitle>
            <CardDescription>
              Create your first signal to start monitoring web changes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconActivity className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                No signals yet. Create one to get started.
              </p>
              <Button className="mt-4">
                <IconPlus className="h-4 w-4" />
                Create Signal
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
