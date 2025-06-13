import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(timestamp: number) {
  // Handle both seconds and milliseconds timestamps
  const date =
    timestamp > 1e10 ? new Date(timestamp) : new Date(timestamp * 1000);
  return date.toLocaleString();
}

export function formatRuleResult(result: string) {
  switch (result) {
    case "Pass":
      return "Pass";
    case "Fail":
      return "Fail";
    case "Skipped":
      return "Skipped";
    case "Unavailable":
      return "Unavailable";
    case "Partially Unavailable":
      return "Partially Unavailable";
    case "Model Not Available":
      return "Model Not Available";
    default:
      return result;
  }
}
