// Arthur GenAI Engine API Client
export interface ArthurClientConfig {
  baseUrl: string;
  apiKey: string;
}

// Types based on OpenAPI specification
export interface TaskResponse {
  id: string;
  name: string;
  created_at: number;
  updated_at: number;
  rules: RuleResponse[];
}

export interface NewTaskRequest {
  name: string;
}

export interface RuleResponse {
  id: string;
  name: string;
  type: RuleType;
  apply_to_prompt: boolean;
  apply_to_response: boolean;
  enabled?: boolean;
  scope: RuleScope;
  created_at: number;
  updated_at: number;
  config?: RuleConfig;
}

export interface NewRuleRequest {
  name: string;
  type: string;
  apply_to_prompt: boolean;
  apply_to_response: boolean;
  config?: RuleConfig;
}

export interface UpdateRuleRequest {
  enabled: boolean;
}

export interface PromptValidationRequest {
  prompt: string;
  conversation_id?: string;
  user_id?: string;
}

export interface ResponseValidationRequest {
  response: string;
  context?: string;
}

export interface ValidationResult {
  inference_id?: string;
  rule_results?: ExternalRuleResult[];
  user_id?: string;
}

export interface ExternalRuleResult {
  id: string;
  name: string;
  rule_type: RuleType;
  scope: RuleScope;
  result: RuleResultEnum;
  latency_ms: number;
  details?: RuleDetails;
}

export interface QueryInferencesResponse {
  count: number;
  inferences: ExternalInference[];
}

export interface ExternalInference {
  id: string;
  result: RuleResultEnum;
  created_at: number;
  updated_at: number;
  task_id?: string;
  task_name?: string;
  conversation_id?: string;
  inference_prompt: ExternalInferencePrompt;
  inference_response?: ExternalInferenceResponse;
  inference_feedback: InferenceFeedbackResponse[];
  user_id?: string;
}

export interface ExternalInferencePrompt {
  id: string;
  inference_id: string;
  result: RuleResultEnum;
  created_at: number;
  updated_at: number;
  message: string;
  prompt_rule_results: ExternalRuleResult[];
  tokens?: number;
}

export interface ExternalInferenceResponse {
  id: string;
  inference_id: string;
  result: RuleResultEnum;
  created_at: number;
  updated_at: number;
  message: string;
  context?: string;
  response_rule_results: ExternalRuleResult[];
  tokens?: number;
}

export interface InferenceFeedbackResponse {
  id: string;
  inference_id: string;
  target: InferenceFeedbackTarget;
  score: number;
  reason?: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
}

// Enums
export type RuleType =
  | "KeywordRule"
  | "ModelHallucinationRuleV2"
  | "ModelSensitiveDataRule"
  | "PIIDataRule"
  | "PromptInjectionRule"
  | "RegexRule"
  | "ToxicityRule";

export type RuleScope = "default" | "task";

export type RuleResultEnum =
  | "Pass"
  | "Fail"
  | "Skipped"
  | "Unavailable"
  | "Partially Unavailable"
  | "Model Not Available";

export type InferenceFeedbackTarget =
  | "context"
  | "response_results"
  | "prompt_results";

export type PaginationSortMethod = "asc" | "desc";

// Rule Configuration Types
export type RuleConfig =
  | KeywordsConfig
  | RegexConfig
  | ExamplesConfig
  | ToxicityConfig
  | PIIConfig;

export interface KeywordsConfig {
  keywords: string[];
}

export interface RegexConfig {
  regex_patterns: string[];
}

export interface ExamplesConfig {
  examples: ExampleConfig[];
  hint?: string;
}

export interface ExampleConfig {
  example: string;
  result: boolean;
}

export interface ToxicityConfig {
  threshold?: number;
}

export interface PIIConfig {
  disabled_pii_entities?: string[];
  confidence_threshold?: number;
  allow_list?: string[];
}

// Rule Details Types
export type RuleDetails =
  | KeywordDetailsResponse
  | RegexDetailsResponse
  | HallucinationDetailsResponse
  | PIIDetailsResponse
  | ToxicityDetailsResponse
  | BaseDetailsResponse;

export interface BaseDetailsResponse {
  score?: boolean;
  message?: string;
}

export interface KeywordDetailsResponse extends BaseDetailsResponse {
  keyword_matches: KeywordSpanResponse[];
}

export interface KeywordSpanResponse {
  keyword: string;
}

export interface RegexDetailsResponse extends BaseDetailsResponse {
  regex_matches: RegexSpanResponse[];
}

export interface RegexSpanResponse {
  matching_text: string;
  pattern?: string;
}

export interface HallucinationDetailsResponse extends BaseDetailsResponse {
  claims: HallucinationClaimResponse[];
}

export interface HallucinationClaimResponse {
  claim: string;
  valid: boolean;
  reason: string;
  order_number?: number;
}

export interface PIIDetailsResponse extends BaseDetailsResponse {
  pii_entities: PIIEntitySpanResponse[];
}

export interface PIIEntitySpanResponse {
  entity: string;
  span: string;
  confidence?: number;
}

export interface ToxicityDetailsResponse extends BaseDetailsResponse {
  toxicity_score?: number;
  toxicity_violation_type: string;
}

// Query Parameters
export interface QueryInferencesParams {
  task_ids?: string[];
  task_name?: string;
  conversation_id?: string;
  inference_id?: string;
  user_id?: string;
  start_time?: string;
  end_time?: string;
  rule_types?: RuleType[];
  rule_statuses?: RuleResultEnum[];
  prompt_statuses?: RuleResultEnum[];
  response_statuses?: RuleResultEnum[];
  include_count?: boolean;
  sort?: PaginationSortMethod;
  page_size?: number;
  page?: number;
}

// Main Client Class
export class ArthurClient {
  private baseUrl: string;
  private apiKey: string;

  constructor(config: ArthurClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, ""); // Remove trailing slash
    this.apiKey = config.apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers = {
      "Content-Type": "application/json",
      Authorization: `Bearer ${this.apiKey}`,
      ...options.headers,
    };

    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Arthur API Error: ${response.status} - ${errorText}`);
    }

    // Handle empty responses
    if (response.status === 204) {
      return {} as T;
    }

    const contentType = response.headers.get("content-type");
    if (contentType?.includes("application/json")) {
      return response.json() as Promise<T>;
    }

    return response.text() as Promise<T>;
  }

  private buildQueryString(params: QueryInferencesParams): string {
    const searchParams = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        if (Array.isArray(value)) {
          value.forEach((item) => searchParams.append(key, String(item)));
        } else if (
          typeof value === "string" ||
          typeof value === "number" ||
          typeof value === "boolean"
        ) {
          searchParams.append(key, String(value));
        }
      }
    });

    return searchParams.toString();
  }

  // Task Operations
  async createTask(request: NewTaskRequest): Promise<TaskResponse> {
    return this.request<TaskResponse>("/api/v2/tasks", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async getTask(taskId: string): Promise<TaskResponse> {
    return this.request<TaskResponse>(`/api/v2/tasks/${taskId}`);
  }

  async searchTasks(searchTerm?: string): Promise<TaskResponse[]> {
    const queryString = searchTerm
      ? `?search=${encodeURIComponent(searchTerm)}`
      : "";
    return this.request<TaskResponse[]>(`/api/v2/tasks${queryString}`);
  }

  async archiveTask(taskId: string): Promise<void> {
    await this.request(`/api/v2/tasks/${taskId}`, {
      method: "DELETE",
    });
  }

  // Task Rule Operations
  async createTaskRule(
    taskId: string,
    request: NewRuleRequest,
  ): Promise<RuleResponse> {
    return this.request<RuleResponse>(`/api/v2/tasks/${taskId}/rules`, {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  async updateTaskRule(
    taskId: string,
    ruleId: string,
    request: UpdateRuleRequest,
  ): Promise<TaskResponse> {
    return this.request<TaskResponse>(
      `/api/v2/tasks/${taskId}/rules/${ruleId}`,
      {
        method: "PATCH",
        body: JSON.stringify(request),
      },
    );
  }

  async archiveTaskRule(taskId: string, ruleId: string): Promise<void> {
    await this.request(`/api/v2/tasks/${taskId}/rules/${ruleId}`, {
      method: "DELETE",
    });
  }

  // Task-based Validation
  async validatePrompt(
    taskId: string,
    request: PromptValidationRequest,
  ): Promise<ValidationResult> {
    return this.request<ValidationResult>(
      `/api/v2/tasks/${taskId}/validate_prompt`,
      {
        method: "POST",
        body: JSON.stringify(request),
      },
    );
  }

  async validateResponse(
    taskId: string,
    inferenceId: string,
    request: ResponseValidationRequest,
  ): Promise<ValidationResult> {
    return this.request<ValidationResult>(
      `/api/v2/tasks/${taskId}/validate_response/${inferenceId}`,
      {
        method: "POST",
        body: JSON.stringify(request),
      },
    );
  }

  // Get Inferences
  async getInferences(
    params: QueryInferencesParams = {},
  ): Promise<QueryInferencesResponse> {
    const queryString = this.buildQueryString(params);
    const endpoint = `/api/v2/inferences/query${queryString ? `?${queryString}` : ""}`;
    return this.request<QueryInferencesResponse>(endpoint);
  }
}

// Utility function to create client
export function createArthurClient(config: ArthurClientConfig): ArthurClient {
  return new ArthurClient(config);
}
