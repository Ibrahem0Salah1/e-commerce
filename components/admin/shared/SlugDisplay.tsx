type SlugDisplayProps = {
  slug: string;
};

export function SlugDisplay({ slug }: SlugDisplayProps) {
  if (!slug) return null;
  return (
    <div className="rounded-md border border-border/40 bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
      /{slug}
    </div>
  );
}
