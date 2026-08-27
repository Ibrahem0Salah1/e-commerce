import { getShippingMethods } from "@/lib/orders/queries";
import { CheckoutClient } from "@/components/checkout/CheckoutClient";

export default async function CheckoutPage() {
  const shippingMethods = await getShippingMethods();

  return <CheckoutClient shippingMethods={shippingMethods} />;
}
