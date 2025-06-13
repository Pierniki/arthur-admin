"use client";

import { useState } from "react";
import { useApiKey } from "./api-key-provider";
import { testArthurConnection } from "@/lib/arthur-actions";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
// import { Alert, AlertDescription } from "./ui/alert";
import { Loader2 } from "lucide-react";

export function ApiKeyInput() {
  const { setApiKey } = useApiKey();
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) {
      setError("Please enter an API key");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await testArthurConnection(inputValue.trim());
      if (result.success) {
        setApiKey(inputValue.trim());
      } else {
        setError(result.error ?? "Failed to connect with the provided API key");
      }
    } catch (err) {
      setError("Failed to validate API key");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Arthur API Key Required</CardTitle>
          <CardDescription>
            Please enter your Arthur API key to access the inference data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Enter your Arthur API key"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isLoading}
              />
            </div>

            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !inputValue.trim()}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Validating...
                </>
              ) : (
                "Connect"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
