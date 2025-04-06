"use server";

import { NextRequest, NextResponse } from "next/server";
import {
  IdentifyKeyFilesRequest,
  IdentifyKeyFilesResponse,
} from "@/app/types/api";

export async function POST(request: NextRequest) {
  try {
    const body: IdentifyKeyFilesRequest = await request.json();
    const BASE_URL = process.env.NEXT_BACKEND_URL_DEV;
    const ENDPOINT = "/analysis/key-files";

    if (!BASE_URL) {
      return NextResponse.json(
        { error: "Backend URL is not configured " },
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
      const errorData = response.json().catch(() => {});
      return NextResponse.json(
        { error: "Backend request failed", details: errorData },
        { status: response.status }
      );
    }

    const data: IdentifyKeyFilesResponse = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error: "Internal server error ",
        message: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
