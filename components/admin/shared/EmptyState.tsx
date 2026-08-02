import { Package } from "lucide-react";

type EmptyStateProps = {
  icon?: React.ReactNode;
  message: string;
};

export function EmptyState({ icon, message }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      {icon ?? <Package className="mb-3 h-12 w-12 text-muted-foreground/40" />}
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
