/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use server";

import { env } from "@/env";
import {
  createArthurClient,
  type QueryInferencesParams,
  type QueryInferencesResponse,
} from "./arthur-client";

function getArthurClient(apiKey: string) {
  const baseUrl = env.ARTHUR_BASE_URL;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "ARTHUR_BASE_URL environment variable and API key are required",
    );
  }

  return createArthurClient({ baseUrl, apiKey });
}

export async function getInferencesAction(
  apiKey: string,
  params: QueryInferencesParams = {},
): Promise<QueryInferencesResponse> {
  const client = getArthurClient(apiKey);
  return await client.getInferences(params);
}

export async function testArthurConnection(apiKey: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = getArthurClient(apiKey);
    // Try to make a simple request to test the connection
    await client.getInferences({ page_size: 1 });
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}
