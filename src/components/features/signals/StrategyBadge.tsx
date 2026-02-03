import { Badge } from "@/components/ui/badge";
import type { ScraperStrategy } from "@prisma/client";

interface StrategyBadgeProps {
  strategy: ScraperStrategy;
}

const strategyColors: Record<ScraperStrategy, string> = {
  AUTO: "bg-blue-500/10 text-blue-500 hover:bg-blue-500/20",
  RSS: "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20",
  REDDIT: "bg-red-500/10 text-red-500 hover:bg-red-500/20",
  HACKERNEWS: "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20",
  HTML: "bg-green-500/10 text-green-500 hover:bg-green-500/20",
};

export function StrategyBadge({ strategy }: StrategyBadgeProps) {
  return (
    <Badge variant="outline" className={strategyColors[strategy]}>
      {strategy}
    </Badge>
  );
}
