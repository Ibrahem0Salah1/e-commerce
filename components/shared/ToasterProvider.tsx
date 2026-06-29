"use client";

import { Toaster } from "sonner";

export function ToasterProvider() {
  return (
    <Toaster
      position="top-center"
      gap={8}
      toastOptions={{
        unstyled: false,
        classNames: {
          toast:
            "group w-full max-w-sm rounded-xl border border-border bg-card px-4 py-3 shadow-lg",
          title: "text-sm font-medium text-foreground",
          description: "mt-1 text-xs text-muted-foreground",
          success:
            "border-l-4 border-l-emerald-500! [&_[data-icon]]:text-emerald-500",
          error:
            "border-l-4 border-l-destructive! [&_[data-icon]]:text-destructive",
          loader: "border-primary/30 border-t-primary",
        },
      }}
    />
  );
}
