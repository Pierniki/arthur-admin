"use client";

import { useQuery } from "@tanstack/react-query";
import { getInferencesAction } from "@/lib/arthur-actions";
import type {
  QueryInferencesParams,
  RuleResultEnum,
} from "@/lib/arthur-client";

export interface InferencesFilters {
  taskName?: string;
  userId?: string;
  startTime?: string;
  endTime?: string;
  ruleStatuses?: RuleResultEnum[];
  page?: number;
  pageSize?: number;
}

export function useInferences(
  apiKey: string | null,
  filters: InferencesFilters = {},
) {
  const params: QueryInferencesParams = {
    task_name: filters.taskName,
    user_id: filters.userId,
    start_time: filters.startTime,
    end_time: filters.endTime,
    rule_statuses: filters.ruleStatuses,
    page: filters.page ?? 0,
    page_size: filters.pageSize ?? 10,
    include_count: true,
    sort: "desc",
  };

  return useQuery({
    queryKey: ["inferences", apiKey, params],
    queryFn: () => {
      if (!apiKey) {
        throw new Error("API key is required");
      }
      return getInferencesAction(apiKey, params);
    },
    enabled: !!apiKey, // Only run query when API key is available
    staleTime: 0,
  });
}
