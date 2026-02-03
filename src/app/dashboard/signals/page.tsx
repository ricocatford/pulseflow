import { IconPlus, IconRadar } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSignals } from "@/actions/signals";
import { SignalTable } from "@/components/features/signals/SignalTable";
import { SignalFilters } from "@/components/features/signals/SignalFilters";
import { SignalPagination } from "@/components/features/signals/SignalPagination";
import { SignalFormDialog } from "@/components/features/signals/SignalFormDialog";

interface SignalsPageProps {
  searchParams: Promise<{
    q?: string;
    status?: string;
    page?: string;
  }>;
}

export default async function SignalsPage({ searchParams }: SignalsPageProps) {
  const params = await searchParams;
  const search = params.q ?? "";
  const status = (params.status ?? "all") as "all" | "active" | "inactive";
  const page = parseInt(params.page ?? "1", 10);

  const result = await getSignals({ search, status, page, limit: 10 });

  if (!result.success) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <p className="text-destructive">Failed to load signals</p>
      </div>
    );
  }

  const { signals, total, totalPages } = result.data;

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Signals</h1>
          <p className="text-muted-foreground">
            Manage your web monitoring signals
          </p>
        </div>
        <SignalFormDialog>
          <Button>
            <IconPlus className="h-4 w-4" />
            New Signal
          </Button>
        </SignalFormDialog>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <IconRadar className="h-5 w-5" />
              Your Signals
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="border-b p-4">
            <SignalFilters />
          </div>
          {signals.length === 0 && !search && status === "all" ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <IconRadar className="h-12 w-12 text-muted-foreground" />
              <p className="mt-4 text-muted-foreground">
                No signals yet. Create one to get started.
              </p>
              <SignalFormDialog>
                <Button className="mt-4">
                  <IconPlus className="h-4 w-4" />
                  Create Signal
                </Button>
              </SignalFormDialog>
            </div>
          ) : (
            <>
              <SignalTable signals={signals} />
              <SignalPagination
                currentPage={page}
                totalPages={totalPages}
                total={total}
              />
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}
