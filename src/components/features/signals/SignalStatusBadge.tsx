import { Badge } from "@/components/ui/badge";

interface SignalStatusBadgeProps {
  isActive: boolean;
}

export function SignalStatusBadge({ isActive }: SignalStatusBadgeProps) {
  return (
    <Badge variant={isActive ? "default" : "secondary"}>
      {isActive ? "Active" : "Inactive"}
    </Badge>
  );
}
