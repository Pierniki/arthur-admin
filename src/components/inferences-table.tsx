"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useInferences, type InferencesFilters } from "@/hooks/use-inferences";
import { useApiKey } from "@/components/api-key-provider";
import type {
  ExternalRuleResult,
  RuleResultEnum,
  RuleDetails,
  KeywordDetailsResponse,
  RegexDetailsResponse,
  HallucinationDetailsResponse,
  PIIDetailsResponse,
  ToxicityDetailsResponse,
} from "@/lib/arthur-client";
import { cn, formatDate, formatRuleResult } from "@/lib/utils";
import { format } from "date-fns";
import {
  AlertCircle,
  AlertTriangle,
  CalendarIcon,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Filter,
  HelpCircle,
  SkipForward,
  X,
} from "lucide-react";
import React, { useState } from "react";
import type { DateRange } from "react-day-picker";

const RULE_STATUSES: RuleResultEnum[] = [
  "Pass",
  "Fail",
  "Skipped",
  "Unavailable",
  "Partially Unavailable",
  "Model Not Available",
];

const PAGE_SIZES = [10, 25, 50, 100];

export function InferencesTable() {
  const { apiKey } = useApiKey();
  const [appliedFilters, setAppliedFilters] = useState<InferencesFilters>({
    page: 0,
    pageSize: 10,
  });
  const [draftFilters, setDraftFilters] = useState<InferencesFilters>({
    page: 0,
    pageSize: 10,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data, isLoading, error } = useInferences(apiKey, appliedFilters);

  // Use data from query
  const inferences = data?.inferences ?? [];
  const totalCount = data?.count ?? 0;
  const totalPages = Math.ceil(totalCount / (appliedFilters.pageSize ?? 10));

  const handleDraftFilterChange = <K extends keyof InferencesFilters>(
    key: K,
    value: InferencesFilters[K],
  ) => {
    setDraftFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handlePageChange = (page: number) => {
    setAppliedFilters((prev) => ({
      ...prev,
      page,
    }));
  };

  const handlePageSizeChange = (pageSize: number) => {
    setAppliedFilters((prev) => ({
      ...prev,
      pageSize,
      page: 0, // Reset to first page when changing page size
    }));
  };

  const handleDateRangeChange = (range: DateRange | undefined) => {
    setDateRange(range);
    setDraftFilters((prev) => ({
      ...prev,
      startTime: range?.from ? range.from.toISOString() : undefined,
      endTime: range?.to ? range.to.toISOString() : undefined,
    }));
  };

  const applyFilters = () => {
    setAppliedFilters((prev) => ({
      ...draftFilters,
      pageSize: prev.pageSize, // Keep current page size
      page: 0, // Reset to first page when applying new filters
    }));
  };

  const clearFilters = () => {
    const clearedFilters = { page: 0, pageSize: appliedFilters.pageSize };
    setDraftFilters(clearedFilters);
    setAppliedFilters(clearedFilters); // Apply cleared filters immediately
    setDateRange(undefined);
  };

  const getRuleResultBadgeVariant = (result: string) => {
    switch (result) {
      case "Pass":
        return "outline"; // Less prominent for passes
      case "Fail":
        return "destructive";
      case "Skipped":
        return "secondary";
      default:
        return "outline";
    }
  };

  const toggleRowExpansion = (inferenceId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(inferenceId)) {
        newSet.delete(inferenceId);
      } else {
        newSet.add(inferenceId);
      }
      return newSet;
    });
  };

  const getFailedRules = (ruleResults: ExternalRuleResult[]) => {
    return ruleResults?.filter((rule) => rule.result === "Fail") ?? [];
  };

  const RuleResultIcon = ({ result }: { result: string }) => {
    const iconProps = { className: "h-3 w-3" };

    switch (result) {
      case "Pass":
        return <Check {...iconProps} className="h-3 w-3 text-green-700" />;
      case "Fail":
        return <X {...iconProps} className="h-3 w-3 text-white" />;
      case "Skipped":
        return <SkipForward {...iconProps} className="h-3 w-3 text-gray-600" />;
      case "Unavailable":
        return <HelpCircle {...iconProps} className="h-3 w-3 text-gray-500" />;
      case "Partially Unavailable":
        return (
          <AlertTriangle {...iconProps} className="h-3 w-3 text-yellow-700" />
        );
      case "Model Not Available":
        return <AlertCircle {...iconProps} className="h-3 w-3 text-red-700" />;
      default:
        return <HelpCircle {...iconProps} className="h-3 w-3 text-gray-500" />;
    }
  };

  const RuleDetailsComponent = ({ details }: { details: RuleDetails }) => {
    if (!details) return null;

    const hasKeywords =
      (details as KeywordDetailsResponse).keyword_matches?.length > 0;
    const hasRegex =
      (details as RegexDetailsResponse).regex_matches?.length > 0;
    const hasClaims =
      (details as HallucinationDetailsResponse).claims?.length > 0;
    const hasPII = (details as PIIDetailsResponse).pii_entities?.length > 0;

    return (
      <div className="bg-muted/30 mt-1 rounded-md p-2 text-xs">
        {details.message && (
          <div className="bg-background/50 mb-2 rounded p-2">
            <p className="text-foreground/80 italic">
              &ldquo;{details.message}&rdquo;
            </p>
          </div>
        )}

        {/* Keyword matches */}
        {hasKeywords && (
          <div className="mb-2">
            <p className="text-foreground mb-1 font-medium">Keywords found:</p>
            <div className="flex flex-wrap gap-1">
              {(details as KeywordDetailsResponse).keyword_matches.map(
                (match, idx) => (
                  <Badge key={idx} variant="secondary" className="text-xs">
                    {match.keyword}
                  </Badge>
                ),
              )}
            </div>
          </div>
        )}

        {/* Regex matches */}
        {hasRegex && (
          <div className="mb-2">
            <p className="text-foreground mb-1 font-medium">Pattern matches:</p>
            <div className="space-y-1">
              {(details as RegexDetailsResponse).regex_matches.map(
                (match, idx) => (
                  <div key={idx} className="bg-background/50 rounded p-1">
                    <code className="text-foreground bg-muted rounded px-1 text-xs">
                      {match.matching_text}
                    </code>
                    {match.pattern && (
                      <span className="text-muted-foreground ml-2">
                        Pattern: {match.pattern}
                      </span>
                    )}
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {/* Hallucination claims */}
        {hasClaims && (
          <div className="mb-2">
            <p className="text-foreground mb-1 font-medium">Claims analysis:</p>
            <div className="space-y-2">
              {(details as HallucinationDetailsResponse).claims.map(
                (claim, idx) => (
                  <div key={idx} className="bg-background/50 rounded p-2">
                    <p className="text-foreground mb-1">{claim.claim}</p>
                    <div className="flex items-center gap-1">
                      {claim.valid ? (
                        <Check className="h-3 w-3 text-green-700" />
                      ) : (
                        <X className="h-3 w-3 text-red-700" />
                      )}
                      <span
                        className={
                          claim.valid
                            ? "font-medium text-green-700"
                            : "font-medium text-red-700"
                        }
                      >
                        {claim.valid ? "Valid" : "Invalid"}
                      </span>
                    </div>
                    {claim.reason && (
                      <p className="text-muted-foreground mt-1">
                        {claim.reason}
                      </p>
                    )}
                  </div>
                ),
              )}
            </div>
          </div>
        )}

        {/* PII entities */}
        {hasPII && (
          <div>
            <p className="text-foreground mb-1 font-medium">PII detected:</p>
            <div className="flex flex-wrap gap-1">
              {(details as PIIDetailsResponse).pii_entities.map(
                (entity, idx) => (
                  <Badge key={idx} variant="destructive" className="text-xs">
                    {entity.entity}: {entity.span}
                    {entity.confidence &&
                      ` (${Math.round(entity.confidence * 100)}%)`}
                  </Badge>
                ),
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  const ToxicityDetailsComponent = ({ details }: { details: RuleDetails }) => {
    const hasToxicity =
      (details as ToxicityDetailsResponse)?.toxicity_score !== undefined;

    if (!hasToxicity) return null;

    const toxicityScore = Math.round(
      (details as ToxicityDetailsResponse).toxicity_score! * 100,
    );
    const isLowToxicity = toxicityScore === 0;

    return (
      <div className="ml-2 flex items-center gap-2">
        <Badge
          variant={isLowToxicity ? "secondary" : "destructive"}
          className="text-xs"
        >
          {toxicityScore}%
        </Badge>
        {(details as ToxicityDetailsResponse).toxicity_violation_type && (
          <span className="text-muted-foreground text-xs">
            {(details as ToxicityDetailsResponse).toxicity_violation_type}
          </span>
        )}
      </div>
    );
  };

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            Error loading inferences: {error.message}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Inferences</h2>
        <Button
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2"
        >
          <Filter className="h-4 w-4" />
          {showFilters ? "Hide Filters" : "Show Filters"}
        </Button>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle>Filters</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="taskName">Task Name</Label>
                <Input
                  id="taskName"
                  placeholder="Filter by task name"
                  value={draftFilters.taskName ?? ""}
                  onChange={(e) =>
                    handleDraftFilterChange(
                      "taskName",
                      e.target.value || undefined,
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="userId">User ID</Label>
                <Input
                  id="userId"
                  placeholder="Filter by user ID"
                  value={draftFilters.userId ?? ""}
                  onChange={(e) =>
                    handleDraftFilterChange(
                      "userId",
                      e.target.value || undefined,
                    )
                  }
                />
              </div>

              <div className="space-y-2">
                <Label>Rule Status</Label>
                <Select
                  value={draftFilters.ruleStatuses?.[0] ?? "all"}
                  onValueChange={(value) =>
                    handleDraftFilterChange(
                      "ruleStatuses",
                      value && value !== "all"
                        ? [value as RuleResultEnum]
                        : undefined,
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Any status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any status</SelectItem>
                    {RULE_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {formatRuleResult(status)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Date Range</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-[280px] justify-start text-left font-normal",
                        !dateRange && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateRange?.from ? (
                        dateRange.to ? (
                          <>
                            {format(dateRange.from, "LLL dd, y")} -{" "}
                            {format(dateRange.to, "LLL dd, y")}
                          </>
                        ) : (
                          format(dateRange.from, "LLL dd, y")
                        )
                      ) : (
                        <span>Pick a date range</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      initialFocus
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={handleDateRangeChange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className="flex items-center gap-4">
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
                <Button onClick={applyFilters}>Save Filters</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Table */}
      <Card className="relative overflow-hidden">
        <div className="absolute top-0 right-0 left-0 h-1 overflow-hidden bg-gray-200">
          {isLoading && (
            <div className="bg-primary h-full w-full animate-pulse"></div>
          )}
        </div>
        <CardContent className="p-0 pt-1">
          <TooltipProvider>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[50px]"></TableHead>
                  <TableHead>ID</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Result</TableHead>
                  <TableHead>User ID</TableHead>
                  <TableHead>Created At</TableHead>
                  <TableHead>Prompt</TableHead>
                  <TableHead>Response</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {inferences.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className="text-muted-foreground py-8 text-center"
                    >
                      No inferences found
                    </TableCell>
                  </TableRow>
                ) : (
                  inferences.map((inference) => {
                    const isExpanded = expandedRows.has(inference.id);
                    const promptFailedRules = getFailedRules(
                      inference.inference_prompt.prompt_rule_results,
                    );
                    const responseFailedRules = getFailedRules(
                      inference.inference_response?.response_rule_results ?? [],
                    );

                    return (
                      <React.Fragment key={inference.id}>
                        <TableRow>
                          <TableCell className="p-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => toggleRowExpansion(inference.id)}
                              className="h-6 w-6 p-0"
                            >
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </Button>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className="cursor-help">
                                  {inference.id.substring(0, 8)}...
                                </span>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p className="font-mono">{inference.id}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TableCell>
                          <TableCell>{inference.task_name ?? "N/A"}</TableCell>
                          <TableCell>
                            <Badge
                              variant={getRuleResultBadgeVariant(
                                inference.result,
                              )}
                              className="flex items-center gap-1"
                            >
                              <RuleResultIcon result={inference.result} />
                              {formatRuleResult(inference.result)}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-mono text-sm">
                            {inference.user_id ?? "N/A"}
                          </TableCell>
                          <TableCell>
                            {formatDate(inference.created_at)}
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="flex items-center gap-2">
                              <span className="truncate">
                                {inference.inference_prompt.message}
                              </span>
                              {promptFailedRules.length > 0 && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  {promptFailedRules.length} failed
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="flex items-center gap-2">
                              <span className="truncate">
                                {inference.inference_response?.message ??
                                  "No response"}
                              </span>
                              {responseFailedRules.length > 0 && (
                                <Badge
                                  variant="destructive"
                                  className="text-xs"
                                >
                                  {responseFailedRules.length} failed
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>

                        {isExpanded && (
                          <TableRow>
                            <TableCell colSpan={8} className="p-0">
                              <div className="bg-muted/30 space-y-4 p-4">
                                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                                  <div>
                                    <h4 className="mb-2 font-semibold">
                                      Prompt Details
                                    </h4>
                                    <div className="space-y-2">
                                      <p className="text-sm break-words whitespace-pre-wrap">
                                        {inference.inference_prompt.message}
                                      </p>
                                      {inference.inference_prompt.tokens && (
                                        <p className="text-muted-foreground text-xs">
                                          Tokens:{" "}
                                          {inference.inference_prompt.tokens}
                                        </p>
                                      )}
                                      <div className="space-y-1">
                                        <p className="text-sm font-medium">
                                          Rule Results:
                                        </p>
                                        {inference.inference_prompt.prompt_rule_results.map(
                                          (rule, idx) => (
                                            <div key={idx} className="mb-3">
                                              <div className="flex items-center">
                                                <Badge
                                                  variant={getRuleResultBadgeVariant(
                                                    rule.result,
                                                  )}
                                                  className="flex items-center gap-1"
                                                >
                                                  <RuleResultIcon
                                                    result={rule.result}
                                                  />
                                                  {rule.name}:{" "}
                                                  {formatRuleResult(
                                                    rule.result,
                                                  )}
                                                </Badge>
                                                {rule.details && (
                                                  <ToxicityDetailsComponent
                                                    details={rule.details}
                                                  />
                                                )}
                                              </div>
                                              {rule.details &&
                                                rule.result !== "Pass" && (
                                                  <RuleDetailsComponent
                                                    details={rule.details}
                                                  />
                                                )}
                                            </div>
                                          ),
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {inference.inference_response && (
                                    <div>
                                      <h4 className="mb-2 font-semibold">
                                        Response Details
                                      </h4>
                                      <div className="space-y-2">
                                        <p className="text-sm break-words whitespace-pre-wrap">
                                          {inference.inference_response.message}
                                        </p>
                                        {inference.inference_response
                                          .tokens && (
                                          <p className="text-muted-foreground text-xs">
                                            Tokens:{" "}
                                            {
                                              inference.inference_response
                                                .tokens
                                            }
                                          </p>
                                        )}
                                        {inference.inference_response
                                          .context && (
                                          <div>
                                            <p className="text-sm font-medium">
                                              Context:
                                            </p>
                                            <p className="text-muted-foreground text-sm break-words whitespace-pre-wrap">
                                              {
                                                inference.inference_response
                                                  .context
                                              }
                                            </p>
                                          </div>
                                        )}
                                        <div className="space-y-1">
                                          <p className="text-sm font-medium">
                                            Rule Results:
                                          </p>
                                          {inference.inference_response.response_rule_results.map(
                                            (rule, idx) => (
                                              <div key={idx} className="mb-3">
                                                <div className="flex items-center">
                                                  <Badge
                                                    variant={getRuleResultBadgeVariant(
                                                      rule.result,
                                                    )}
                                                    className="flex items-center gap-1"
                                                  >
                                                    <RuleResultIcon
                                                      result={rule.result}
                                                    />
                                                    {rule.name}:{" "}
                                                    {formatRuleResult(
                                                      rule.result,
                                                    )}
                                                  </Badge>
                                                  {rule.details && (
                                                    <ToxicityDetailsComponent
                                                      details={rule.details}
                                                    />
                                                  )}
                                                </div>
                                                {rule.details &&
                                                  rule.result !== "Pass" && (
                                                    <RuleDetailsComponent
                                                      details={rule.details}
                                                    />
                                                  )}
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TooltipProvider>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Label>Rows per page:</Label>
          <Select
            value={String(appliedFilters.pageSize)}
            onValueChange={(value) => handlePageSizeChange(Number(value))}
          >
            <SelectTrigger className="w-[80px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZES.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <span className="text-muted-foreground text-sm">
            Page {(appliedFilters.page ?? 0) + 1} of {totalPages} ({totalCount}{" "}
            total)
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange((appliedFilters.page ?? 0) - 1)}
            disabled={
              appliedFilters.page === undefined || appliedFilters.page <= 0
            }
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handlePageChange((appliedFilters.page ?? 0) + 1)}
            disabled={
              appliedFilters.page === undefined ||
              appliedFilters.page >= totalPages - 1
            }
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
