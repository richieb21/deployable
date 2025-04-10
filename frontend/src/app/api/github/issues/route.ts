"use server";

import { NextRequest, NextResponse } from "next/server";

/**
 * GitHub Issues API Route
 *
 * This API route handles the creation of GitHub issues by proxying requests to the backend server.
 *
 * Example request body:
 * {
 *   "owner": "richieb21",
 *   "repo": "deployable",
 *   "title": "Test 1",
 *   "body": "This is a test issue created via the API to verify functionality.",
 *   "labels": ["bug", "test"],
 *   "assignees": ["steventanyang"]
 * }
 *
 * The route validates the request, forwards it to the backend, and handles any errors
 * that might occur during the process.
 */

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
    const BASE_URL = process.env.BACKEND_API_URL;
    const ENDPOINT = "/github/issues";

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

      // Check for .deployable file error in the detail field
      if (
        (errorData?.detail &&
          (errorData.detail.includes(".deployable") ||
            errorData.detail.toLowerCase().includes("deployable"))) ||
        (errorText &&
          (errorText.includes(".deployable") ||
            errorText.toLowerCase().includes("deployable")))
      ) {
        console.error("Detected .deployable file missing error");
        return NextResponse.json(
          {
            error: "Repository not enabled for Deployable",
            details:
              "This repository has not been enabled for Deployable. A .deployable file must be present in the repository root.",
            originalError: errorData,
          },
          { status: 403 }
        );
      }

      return NextResponse.json(
        {
          error: "Failed to create GitHub issue",
          details: errorData.detail || errorData.message || "Unknown error",
          originalError: errorData,
        },
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
