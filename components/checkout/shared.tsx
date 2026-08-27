import type { ReactNode } from "react";

export const inputClass = "h-10 md:h-11 rounded-sm text-sm md:text-[15px]";
export const errorText = "mt-1.5 text-xs text-destructive";

export function SectionTitle({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-base md:text-xl font-bold tracking-tight text-foreground">
      {children}
    </h2>
  );
}
