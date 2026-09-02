-- CreateIndex
CREATE INDEX IF NOT EXISTS "orders_paymentStatus_paidAt_idx" ON "orders"("paymentStatus", "paidAt");
CREATE INDEX IF NOT EXISTS "orders_paidAt_idx" ON "orders"("paidAt");
