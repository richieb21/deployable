"use client";

import { useEffect, useState } from "react";

interface AnalysisEvent {
  type: "PROGRESS" | "COMPLETE" | "HEARTBEAT";
  chunk_index?: number;
  files?: string[];
  recommendations_count?: number;
  recommendations?: any[];
  analysis_timestamp?: string;
}

export default function TestAnalysis() {
  const [events, setEvents] = useState<AnalysisEvent[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const startAnalysis = async () => {
      try {
        // 1. Start the analysis stream
        const startResponse = await fetch(
          "http://localhost:8000/stream/start",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              repo_url: "https://github.com/richieb21/deployable",
            }),
          }
        );

        if (!startResponse.ok) {
          throw new Error("Failed to start analysis");
        }

        const { analysis_id } = await startResponse.json();
        console.log("Analysis started with ID:", analysis_id);

        // 2. Connect to the event stream
        const eventSource = new EventSource(
          `http://localhost:8000/stream/analysis/${analysis_id}`,
          { withCredentials: false }
        );

        eventSource.onmessage = (event) => {
          const data = JSON.parse(event.data) as AnalysisEvent;
          console.log("Received event:", data);

          setEvents((prev) => [...prev, data]);

          // Close the connection when we receive the complete event
          if (data.type === "COMPLETE") {
            eventSource.close();
          }
        };

        eventSource.onerror = (error) => {
          console.error("EventSource error:", error);
          eventSource.close();
          setError("Stream connection error");
        };

        // 3. Start the actual analysis
        const analysisResponse = await fetch("http://localhost:8000/analysis", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            repo_url: "https://github.com/richieb21/deployable",
            analysis_id,
          }),
        });

        if (!analysisResponse.ok) {
          throw new Error("Analysis failed to start");
        }
      } catch (err) {
        console.error("Error:", err);
        setError(err instanceof Error ? err.message : "Unknown error occurred");
      }
    };

    startAnalysis();
  }, []); // Run once on mount

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Analysis Test</h1>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {events.map((event, index) => (
          <div key={index} className="border p-4 rounded">
            <h3 className="font-bold">Event Type: {event.type}</h3>

            {event.type === "PROGRESS" && (
              <>
                <p>Chunk Index: {event.chunk_index}</p>
                <p>Files Processed: {event.files?.join(", ")}</p>
                <p>Recommendations Found: {event.recommendations_count}</p>
              </>
            )}

            {event.type === "COMPLETE" && (
              <>
                <p>Analysis Complete!</p>
                <p>Total Recommendations: {event.recommendations?.length}</p>
                <p>Timestamp: {event.analysis_timestamp}</p>
              </>
            )}

            {event.type === "HEARTBEAT" && <p>Keeping connection alive...</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
