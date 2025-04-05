"use server";

import { NextRequest, NextResponse } from "next/server";

interface CreateIssueRequest {
  owner: string;
  repo: string;
  title: string;
  body: string;
  labels?: string[];
  assignees?: string[];
}

interface IssueResponse {
  url: string;
  html_url: string;
  number: number;
  title: string;
  state: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CreateIssueRequest = await request.json();
    const BASE_URL = "http://localhost:8000"; // Same as other API routes
    const ENDPOINT = "/github/issues"; // This should match the backend endpoint

    if (!BASE_URL) {
      return NextResponse.json(
        { error: "Backend URL is not configured" },
        { status: 500 }
      );
    }

    const url = `${BASE_URL}${ENDPOINT}`;

    console.log("Sending request to:", url);
    console.log("Request body:", JSON.stringify(body, null, 2));

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Error response:", response.status, errorText);

      let errorData;
      try {
        errorData = JSON.parse(errorText);
      } catch (e) {
        errorData = {
          error: errorText,
          message: e instanceof Error ? e.message : "Unknown error",
        };
      }

      return NextResponse.json(
        { error: "Failed to create GitHub issue", details: errorData },
        { status: response.status }
      );
    }

    const data: IssueResponse = await response.json();
    console.log("Successfully created issue:", data);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error("GitHub issue API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
