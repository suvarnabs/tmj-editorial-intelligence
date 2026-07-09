import { BriefView } from "@/components/BriefView";
import { EmptyState, ErrorState } from "@/components/StateMessage";
import { fetchApi } from "@/lib/api";
import type { Brief } from "@/lib/types";

export default async function TodayBriefPage() {
  const result = await fetchApi<Brief>("/api/v1/briefs/today");

  return (
    <main className="container page-stack">
      <div className="page-heading">
        <h1>Today's Brief</h1>
        <p>Generated daily editorial brief using the Asia/Qatar calendar date.</p>
      </div>

      {result.data ? (
        <BriefView brief={result.data} />
      ) : result.status === 404 ? (
        <EmptyState message="No brief found for today. Generate a brief from the backend first." />
      ) : (
        <ErrorState message={`Could not load today's brief: ${result.error}`} />
      )}
    </main>
  );
}
