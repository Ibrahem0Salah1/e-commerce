"use client";

import { ContactSection } from "./formComponents/ContactSection";
import { DeliverySection } from "./formComponents/DeliverySection";
import { ShippingMethodSection } from "./formComponents/ShippingMethodSection";
import { PaymentSection } from "./formComponents/PaymentSection";
import { FormActions } from "./formComponents/FormActions";
import type { ShippingMethodOption } from "@/lib/orders/types";

type Props = {
  shippingMethods: ShippingMethodOption[];
  isPlacingOrder: boolean;
  isMerging: boolean;
  hasPendingMerge: boolean;
};

export function CheckoutForm({
  shippingMethods,
  isPlacingOrder,
  isMerging,
  hasPendingMerge,
}: Props) {
  return (
    <>
      <ContactSection disabled={isPlacingOrder} />

      <DeliverySection disabled={isPlacingOrder} />

      <ShippingMethodSection shippingMethods={shippingMethods} />

      <PaymentSection />

      <FormActions
        isPlacingOrder={isPlacingOrder}
        isMerging={isMerging}
        hasPendingMerge={hasPendingMerge}
      />
    </>
  );
}
