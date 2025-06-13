/* eslint-disable @typescript-eslint/no-unsafe-assignment */
"use server";

import { env } from "@/env";
import {
  createArthurClient,
  type NewTaskRequest,
  type NewRuleRequest,
  type UpdateRuleRequest,
  type PromptValidationRequest,
  type ResponseValidationRequest,
  type QueryInferencesParams,
  type TaskResponse,
  type RuleResponse,
  type ValidationResult,
  type QueryInferencesResponse,
} from "./arthur-client";

// Get client configuration from environment variables
function getArthurClient() {
  const baseUrl = env.ARTHUR_BASE_URL;
  const apiKey = env.ARTHUR_API_KEY;

  if (!baseUrl || !apiKey) {
    throw new Error(
      "ARTHUR_BASE_URL and ARTHUR_API_KEY environment variables are required",
    );
  }

  return createArthurClient({ baseUrl, apiKey });
}

// Task Actions
export async function createTaskAction(
  request: NewTaskRequest,
): Promise<TaskResponse> {
  const client = getArthurClient();
  return await client.createTask(request);
}

export async function getTaskAction(taskId: string): Promise<TaskResponse> {
  const client = getArthurClient();
  return await client.getTask(taskId);
}

export async function searchTasksAction(
  searchTerm?: string,
): Promise<TaskResponse[]> {
  const client = getArthurClient();
  return await client.searchTasks(searchTerm);
}

export async function archiveTaskAction(taskId: string): Promise<void> {
  const client = getArthurClient();
  return await client.archiveTask(taskId);
}

// Task Rule Actions
export async function createTaskRuleAction(
  taskId: string,
  request: NewRuleRequest,
): Promise<RuleResponse> {
  const client = getArthurClient();
  return await client.createTaskRule(taskId, request);
}

export async function updateTaskRuleAction(
  taskId: string,
  ruleId: string,
  request: UpdateRuleRequest,
): Promise<TaskResponse> {
  const client = getArthurClient();
  return await client.updateTaskRule(taskId, ruleId, request);
}

export async function archiveTaskRuleAction(
  taskId: string,
  ruleId: string,
): Promise<void> {
  const client = getArthurClient();
  return await client.archiveTaskRule(taskId, ruleId);
}

// Validation Actions
export async function validatePromptAction(
  taskId: string,
  request: PromptValidationRequest,
): Promise<ValidationResult> {
  const client = getArthurClient();
  return await client.validatePrompt(taskId, request);
}

export async function validateResponseAction(
  taskId: string,
  inferenceId: string,
  request: ResponseValidationRequest,
): Promise<ValidationResult> {
  const client = getArthurClient();
  return await client.validateResponse(taskId, inferenceId, request);
}

// Get Actions
export async function getInferencesAction(
  params: QueryInferencesParams = {},
): Promise<QueryInferencesResponse> {
  const client = getArthurClient();
  return await client.getInferences(params);
}

// Form-specific server actions for better integration with forms
export async function createTaskFormAction(formData: FormData) {
  const name = formData.get("name") as string;
  if (!name) {
    throw new Error("Task name is required");
  }

  return await createTaskAction({ name });
}

export async function createTaskRuleFormAction(formData: FormData) {
  const taskId = formData.get("taskId") as string;
  const name = formData.get("name") as string;
  const type = formData.get("type") as string;
  const applyToPrompt = formData.get("applyToPrompt") === "true";
  const applyToResponse = formData.get("applyToResponse") === "true";

  if (!taskId || !name || !type) {
    throw new Error("Task ID, name, and type are required");
  }

  const request: NewRuleRequest = {
    name,
    type,
    apply_to_prompt: applyToPrompt,
    apply_to_response: applyToResponse,
  };

  // Handle specific rule configurations based on type
  if (type === "KeywordRule") {
    const keywords = formData.get("keywords") as string;
    if (keywords) {
      request.config = {
        keywords: keywords
          .split(",")
          .map((k) => k.trim())
          .filter((k) => k.length > 0),
      };
    }
  } else if (type === "RegexRule") {
    const patterns = formData.get("regexPatterns") as string;
    if (patterns) {
      request.config = {
        regex_patterns: patterns
          .split(",")
          .map((p) => p.trim())
          .filter((p) => p.length > 0),
      };
    }
  } else if (type === "ToxicityRule") {
    const threshold = formData.get("threshold") as string;
    if (threshold) {
      request.config = {
        threshold: parseFloat(threshold),
      };
    }
  } else if (type === "PIIDataRule") {
    const confidenceThreshold = formData.get("confidenceThreshold") as string;
    const disabledEntities = formData.get("disabledPiiEntities") as string;
    const allowList = formData.get("allowList") as string;

    request.config = {
      ...(confidenceThreshold && {
        confidence_threshold: parseFloat(confidenceThreshold),
      }),
      ...(disabledEntities && {
        disabled_pii_entities: disabledEntities
          .split(",")
          .map((e) => e.trim())
          .filter((e) => e.length > 0),
      }),
      ...(allowList && {
        allow_list: allowList
          .split(",")
          .map((a) => a.trim())
          .filter((a) => a.length > 0),
      }),
    };
  } else if (type === "ModelSensitiveDataRule") {
    const hint = formData.get("hint") as string;
    const examplesJson = formData.get("examples") as string;

    if (examplesJson) {
      try {
        const parsedExamples = JSON.parse(examplesJson) as unknown;
        if (Array.isArray(parsedExamples)) {
          request.config = {
            examples: parsedExamples as Array<{
              example: string;
              result: boolean;
            }>,
            ...(hint && { hint }),
          };
        } else {
          throw new Error("Examples must be an array");
        }
      } catch (error) {
        throw new Error("Invalid examples JSON format");
      }
    }
  }

  return await createTaskRuleAction(taskId, request);
}

export async function updateTaskRuleFormAction(formData: FormData) {
  const taskId = formData.get("taskId") as string;
  const ruleId = formData.get("ruleId") as string;
  const enabled = formData.get("enabled") === "true";

  if (!taskId || !ruleId) {
    throw new Error("Task ID and Rule ID are required");
  }

  return await updateTaskRuleAction(taskId, ruleId, { enabled });
}

export async function validatePromptFormAction(formData: FormData) {
  const taskId = formData.get("taskId") as string;
  const prompt = formData.get("prompt") as string;
  const conversationId = formData.get("conversationId") as string;
  const userId = formData.get("userId") as string;

  if (!taskId || !prompt) {
    throw new Error("Task ID and prompt are required");
  }

  const request: PromptValidationRequest = {
    prompt,
    ...(conversationId && { conversation_id: conversationId }),
    ...(userId && { user_id: userId }),
  };

  return await validatePromptAction(taskId, request);
}

export async function validateResponseFormAction(formData: FormData) {
  const taskId = formData.get("taskId") as string;
  const inferenceId = formData.get("inferenceId") as string;
  const response = formData.get("response") as string;
  const context = formData.get("context") as string;

  if (!taskId || !inferenceId || !response) {
    throw new Error("Task ID, inference ID, and response are required");
  }

  const request: ResponseValidationRequest = {
    response,
    ...(context && { context }),
  };

  return await validateResponseAction(taskId, inferenceId, request);
}

// Utility actions for error handling and validation
export async function testArthurConnection(): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const client = getArthurClient();
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
