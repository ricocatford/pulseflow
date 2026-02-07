import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { scrapeSignal } from "@/inngest/functions/scrapeSignal";
import { scheduleScrapes } from "@/inngest/functions/scheduleScrapes";

export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [scrapeSignal, scheduleScrapes],
});
