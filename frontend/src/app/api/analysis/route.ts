"use server";

import { NextRequest, NextResponse } from "next/server";
import { AnalysisRequest, AnalysisResponse } from "../../types/api";

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();
    const BASE_URL = "http://localhost:8000"; //process.env.DEV_BACKEND_URL; // todo add condition logic to choose URL
    const ENDPOINT = "/analysis";

    if (!BASE_URL) {
      return NextResponse.json(
        { error: "Backend URL is not configured" },
        { status: 500 }
      );
    }

    const url = `${BASE_URL}${ENDPOINT}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Backend request failed", details: errorData },
        { status: response.status }
      );
    }

    const data: AnalysisResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Analysis API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
