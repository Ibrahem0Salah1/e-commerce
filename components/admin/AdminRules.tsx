import { Info } from "lucide-react";

const rules = {
  restock: [
    "The product must exist before you can restock it. If it doesn't exist, create it first (new products start inactive with 0 stock).",
    "The selling price is calculated as: cost price + margin%. You set the cost and margin per line.",
    "Restocking updates the product's price, cost price, margin and stock directly — and auto-activates inactive products on first restock.",
    "Do not update the cost price by editing the product — cost price is only set through restock invoices. This keeps your cost history accurate for revenue reports.",
  ],
  addProduct: [
    "New products are created as inactive with 0 stock and 0 price — pricing is set only via Restock → New Purchase Invoice.",
    "After creation, restock the product to set its cost price, margin and opening quantity. The product will be auto-activated on first restock.",
    "To change price or cost later, create another restock invoice — do not edit price/stock directly.",
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
