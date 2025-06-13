// Arthur GenAI Engine API Client
export interface ArthurClientConfig {
  baseUrl: string;
  apiKey: string;
}

// Types for QueryInferences functionality
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

export interface ExternalRuleResult {
  id: string;
  name: string;
  rule_type: RuleType;
  scope: RuleScope;
  result: RuleResultEnum;
  latency_ms: number;
  details?: RuleDetails;
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

// Rule Details Types (kept for ExternalRuleResult)
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
