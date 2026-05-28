"use client";

import { useEffect } from "react";
import { toast } from "sonner";

interface AnalyticsErrorToastProps {
  error?: string;
  title?: string;
}

export function AnalyticsErrorToast({ error, title = "GA4 Connection Error" }: AnalyticsErrorToastProps) {
  useEffect(() => {
    if (error) {
      toast.error(title, {
        description: error,
        duration: 8000, // Keep it visible so they have time to read/copy
      });
    }
  }, [error, title]);

  return null; // Visual-less component that triggers side effect only
}
