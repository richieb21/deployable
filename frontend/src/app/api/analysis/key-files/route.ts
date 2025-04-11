"use server";

import { NextRequest, NextResponse } from "next/server";
import {
  IdentifyKeyFilesRequest,
  IdentifyKeyFilesResponse,
} from "@/app/types/api";

export async function POST(request: NextRequest) {
  try {
    console.log("POST /api/analysis/key-files: Processing request");
    const body: IdentifyKeyFilesRequest = await request.json();
    console.log("Request body:", JSON.stringify(body));

    const BASE_URL = process.env.BACKEND_API_URL;
    const ENDPOINT = "/analysis/key-files";

    if (!BASE_URL) {
      console.error(
        "Backend URL is not configured. BACKEND_API_URL env variable is missing."
      );
      return NextResponse.json(
        { error: "Backend URL is not configured " },
        { status: 500 }
      );
    }

    const url = `${BASE_URL}${ENDPOINT}`;
    console.log(`Making request to backend: ${url}`);

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      console.error(`Backend request failed with status ${response.status}`);
      try {
        const errorText = await response.text();
        console.error("Backend error response:", errorText);
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { rawText: errorText };
        }
        return NextResponse.json(
          { error: "Backend request failed", details: errorData },
          { status: response.status }
        );
      } catch (err) {
        console.error("Failed to parse error response:", err);
        return NextResponse.json(
          {
            error: "Backend request failed",
            details: "Could not parse error response",
          },
          { status: response.status }
        );
      }
    }

    const data: IdentifyKeyFilesResponse = await response.json();
    console.log("Backend response received successfully");
    return NextResponse.json(data);
  } catch (error) {
    console.error("Unhandled exception in /api/analysis/key-files:", error);
    return NextResponse.json(
      {
        error: "Internal server error ",
        message: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
