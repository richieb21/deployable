"use client";

import { useEffect, useState } from "react";

export default function StatsTestPage() {
  const [stats, setStats] = useState({
    repos: 0,
    files: 0,
    recommendations: 0,
  });
  const [status, setStatus] = useState("connecting");

  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/stats");

    ws.onopen = () => {
      setStatus("connected");
      console.log("Connected to WebSocket");
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received:", data);
        setStats(data);
      } catch (error) {
        console.error(
          "Error parsing WebSocket message:",
          error,
          "Raw data:",
          event.data
        );
      }
    };

    ws.onerror = (error) => {
      console.error("WebSocket error:", error);
      setStatus("error");
    };

    ws.onclose = (event) => {
      console.log("WebSocket closed:", event);
      setStatus("error");
    };

    return () => {
      console.log("Closing WebSocket connection");
      ws.close();
    };
  }, []);

  return (
    <div className="p-4">
      <div>Status: {status}</div>
      <div>Repos: {stats.repos}</div>
      <div>Files: {stats.files}</div>
      <div>Recommendations: {stats.recommendations}</div>
      <pre>{JSON.stringify(stats, null, 2)}</pre>
    </div>
  );
}
