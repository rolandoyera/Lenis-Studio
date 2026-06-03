"use client";

import { useTheme } from "next-themes";
import { Toaster as Sonner, type ToasterProps } from "sonner";
import {
  CircleCheckIcon,
  InfoIcon,
  TriangleAlertIcon,
  OctagonXIcon,
  Loader2Icon,
} from "lucide-react";

const Toaster = ({ position = "top-center", ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      position={position}
      icons={{
        success: <CircleCheckIcon className="size-4" />,
        info: <InfoIcon className="size-4" />,
        warning: <TriangleAlertIcon className="size-4" />,
        error: <OctagonXIcon className="size-4" />,
        loading: <Loader2Icon className="size-4 animate-spin" />,
      }}
      style={
        {
          "--normal-bg": "var(--popover)",
          "--normal-text": "var(--popover-foreground)",
          "--normal-border": "var(--border)",
          "--border-radius": "var(--radius)",
          "--success-bg": "rgba(16, 185, 129, 0.1)",
          "--success-text": "#10b981",
          "--success-border": "rgba(16, 185, 129, 0.2)",
          "--error-bg": "rgba(239, 68, 68, 0.1)",
          "--error-text": "#ef4444",
          "--error-border": "rgba(239, 68, 68, 0.2)",
          "--warning-bg": "rgba(245, 158, 11, 1)",
          "--warning-text": "#f59e0b",
          "--warning-border": "rgba(245, 158, 11, 0.2)",
          "--info-bg": "rgba(59, 130, 246, 0.1)",
          "--info-text": "#3b82f6",
          "--info-border": "rgba(59, 130, 246, 0.2)",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "cn-toast group-[.toaster]:border-border group-[.toaster]:shadow-lg",
          error:
            "group-[.toaster]:!bg-red-500/10 group-[.toaster]:!text-red-600 group-[.toaster]:!border-red-500/20 dark:group-[.toaster]:!bg-red-500/15 dark:group-[.toaster]:!text-red-400 dark:group-[.toaster]:!border-red-500/30",
          success:
            "group-[.toaster]:!bg-emerald-500/10 group-[.toaster]:!text-emerald-600 group-[.toaster]:!border-emerald-500/20 dark:group-[.toaster]:!bg-emerald-500/15 dark:group-[.toaster]:!text-emerald-400 dark:group-[.toaster]:!border-emerald-500/30",
          warning:
            "group-[.toaster]:!bg-amber-500/10 group-[.toaster]:!text-amber-600 group-[.toaster]:!border-amber-500/20 dark:group-[.toaster]:!bg-amber-500/15 dark:group-[.toaster]:!text-amber-400 dark:group-[.toaster]:!border-amber-500/30",
          info: "group-[.toaster]:!bg-blue-500/10 group-[.toaster]:!text-blue-600 group-[.toaster]:!border-blue-500/20 dark:group-[.toaster]:!bg-blue-500/15 dark:group-[.toaster]:!text-blue-400 dark:group-[.toaster]:!border-blue-500/30",
        },
      }}
      {...props}
    />
  );
};

export { Toaster };
