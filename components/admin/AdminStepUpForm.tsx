"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { requestAdminStepUpOtp, verifyAdminStepUpOtp } from "@/lib/auth/admin-2fa-actions";

export function AdminStepUpForm({ callbackUrl }: { callbackUrl: string }) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const sent = useRef(false);
  const router = useRouter();

  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    setSending(true);
    requestAdminStepUpOtp().then((res) => {
      setSending(false);
      if (!res.ok) setError(res.error);
    });
  }, []);

  const handleResend = async () => {
    setError(null);
    setSending(true);
    const res = await requestAdminStepUpOtp();
    setSending(false);
    if (!res.ok) setError(res.error);
  };

  const handleVerify = async () => {
    setError(null);
    setVerifying(true);
    const res = await verifyAdminStepUpOtp(code);
    setVerifying(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  };

  return (
    <div className="mt-6 space-y-3">
      <Input
        placeholder="123456"
        maxLength={6}
        autoFocus
        value={code}
        onChange={(e) => setCode(e.target.value)}
        disabled={sending || verifying}
      />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button className="w-full" onClick={handleVerify} disabled={verifying || code.length < 6}>
        {verifying ? "Verifying..." : "Verify"}
      </Button>
      <button
        type="button"
        onClick={handleResend}
        disabled={sending}
        className="text-xs text-muted-foreground underline"
      >
        {sending ? "Sending..." : "Resend code"}
      </button>
    </div>
  );
}