"use client";

import { InferencesTable } from "@/components/inferences-table";
import { ApiKeyProvider, useApiKey } from "@/components/api-key-provider";
import { ApiKeyInput } from "@/components/api-key-input";
import { ApiKeyDisconnect } from "@/components/api-key-disconnect";

function InferencesContent() {
  const { apiKey } = useApiKey();

  if (!apiKey) {
    return <ApiKeyInput />;
  }

  return (
    <main className="container mx-auto py-8">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Arthur GenAI Inferences</h1>
        <ApiKeyDisconnect />
      </div>
      <InferencesTable />
    </main>
  );
}

export default function InferencesPage() {
  return (
    <ApiKeyProvider>
      <InferencesContent />
    </ApiKeyProvider>
  );
}
