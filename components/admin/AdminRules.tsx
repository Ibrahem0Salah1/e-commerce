import { Info } from "lucide-react";

const rules = {
  restock: [
    "The product must exist before you can restock it. If it doesn't exist, create it first.",
    "If a product has only one variant, that variant is the 'Default' variant — it represents the product itself.",
    "The selling price is calculated as: cost price + margin%. You set the cost and margin per line.",
    "Restocking updates the variant's price and stock. It also updates the product's basePrice (shown as 'starts from' on the shop).",
    "Do not update the cost price by editing a variant — cost price is only set through restock invoices. This keeps your cost history accurate for revenue reports.",
    "basePrice on the product card is always the lowest active variant price. It's shown to customers as 'starts from X EGP'.",
  ],
  addProduct: [
    "When you create a product, a 'Default' variant is automatically created with the price you enter.",
    "The product's basePrice is always calculated from the lowest active variant price — you cannot set it manually.",
    "To change the price of a single-variant product, edit the 'Default' variant's price. The basePrice will update automatically.",
    "To add more variants later, use the variant management on the product detail page.",
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
