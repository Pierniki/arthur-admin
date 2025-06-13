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

export function useInferences(filters: InferencesFilters = {}) {
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
    queryKey: ["inferences", params],
    queryFn: () => getInferencesAction(params),
    staleTime: 0,
  });
}
