import { Info } from "lucide-react";

const rules = {
  restock: [
    "The product must exist before you can restock it. If it doesn't exist, create it first.",
    "The selling price is calculated as: cost price + margin%. You set the cost and margin per line.",
    "Restocking updates the product's price and stock directly.",
    "Do not update the cost price by editing the product — cost price is only set through restock invoices. This keeps your cost history accurate for revenue reports.",
  ],
  addProduct: [
    "Set the price and stock when creating the product.",
    "To change the price or stock later, edit the product or use restock invoices.",
  ],
} as const;

type Props = {
  variant: keyof typeof rules;
};

export function AdminRules({ variant }: Props) {
  const items = rules[variant];

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="mb-2 flex items-center gap-2">
        <Info className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-medium">Important Rules</h3>
      </div>
      <ul className="space-y-1.5 text-sm text-muted-foreground">
        {items.map((rule, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-muted-foreground/40 shrink-0">{i + 1}.</span>
            <span>{rule}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
