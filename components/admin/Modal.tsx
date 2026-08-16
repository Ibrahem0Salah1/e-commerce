"use client";

import { useCallback, useRef, type ReactNode } from "react";

const sizeMap = {
  md: "max-w-2xl",
  lg: "max-w-4xl",
  xl: "max-w-6xl",
} as const;

type Props = {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: keyof typeof sizeMap;
};

export function Modal({ open, onClose, children, size = "md" }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);

  const handleOverlay = useCallback(
    (e: React.MouseEvent) => {
      if (e.target === overlayRef.current) onClose();
    },
    [onClose],
  );

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlay}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
    >
      <div
        className={`relative max-h-[90vh] w-full ${sizeMap[size]} overflow-y-auto rounded-xl bg-white p-6 shadow-xl dark:bg-card`}
      >
        <button
          onClick={onClose}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          ✕
        </button>
        {children}
      </div>
    </div>
  );
}
