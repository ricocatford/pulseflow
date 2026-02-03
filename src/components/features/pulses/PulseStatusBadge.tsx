import { Badge } from "@/components/ui/badge";

interface PulseStatusBadgeProps {
  status: string;
}

export function PulseStatusBadge({ status }: PulseStatusBadgeProps) {
  const variant = status === "SUCCESS" ? "default" : "destructive";

  return <Badge variant={variant}>{status}</Badge>;
}
