"use client";

import { useApiKey } from "./api-key-provider";
import { Button } from "./ui/button";
import { LogOut } from "lucide-react";

export function ApiKeyDisconnect() {
  const { setApiKey } = useApiKey();

  const handleDisconnect = () => {
    setApiKey(null);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDisconnect}
      className="gap-2"
    >
      <LogOut className="h-4 w-4" />
      Disconnect
    </Button>
  );
}
