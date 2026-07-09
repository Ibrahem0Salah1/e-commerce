"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

export function TruncatedDescription({
  paragraphs,
  clampLines = 3,
}: {
  paragraphs: string[];
  clampLines?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const needsTruncation = paragraphs.length > 1 || paragraphs.some((p) => p.length > 200);

  return (
    <div>
      <div
        className={cn(
          "space-y-2 text-sm leading-relaxed text-muted-foreground",
          !expanded && needsTruncation && "line-clamp-[8]"
        )}
      >
        {paragraphs.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {needsTruncation && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-1.5 text-xs font-medium text-primary transition-colors hover:text-primary/80"
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
