"use client";

import { FormEvent, useState } from "react";
import { BriefView } from "@/components/BriefView";
import { EmptyState, ErrorState, LoadingState } from "@/components/StateMessage";
import { fetchApi } from "@/lib/api";
import type { Brief } from "@/lib/types";

export default function BriefByDatePage() {
  const today = new Date().toISOString().slice(0, 10);
  const [selectedDate, setSelectedDate] = useState(today);
  const [brief, setBrief] = useState<Brief | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "empty" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("loading");
    setBrief(null);
    setError("");

    const result = await fetchApi<Brief>(`/api/v1/briefs/${selectedDate}`);
    if (result.data) {
      setBrief(result.data);
      setStatus("idle");
      return;
    }

    if (result.status === 404) {
      setStatus("empty");
      return;
    }

    setError(result.error);
    setStatus("error");
  }

  return (
    <main className="container page-stack">
      <div className="page-heading">
        <h1>Brief by Date</h1>
        <p>Look up an existing brief. This page does not generate new briefs.</p>
      </div>

      <form className="panel form-row" onSubmit={handleSubmit}>
        <label htmlFor="brief-date">Brief date</label>
        <input
          id="brief-date"
          type="date"
          value={selectedDate}
          onChange={(event) => setSelectedDate(event.target.value)}
        />
        <button type="submit">Load Brief</button>
      </form>

      {status === "loading" && <LoadingState label="Loading brief..." />}
      {status === "empty" && <EmptyState message="No brief found for this date." />}
      {status === "error" && <ErrorState message={`Could not load brief: ${error}`} />}
      {brief && <BriefView brief={brief} />}
    </main>
  );
}
