"use server";

import { randomInt } from "crypto";
import { getCurrentSession } from "@/lib/auth/authz";
import { sendEmail } from "@/lib/auth/email-verification";
import {
  getChallenge,
  setChallenge,
  clearChallenge,
  markSessionTwoFactorVerified,
  ADMIN_2FA_RESEND_COOLDOWN_MS,
  ADMIN_2FA_MAX_ATTEMPTS,
} from "@/lib/auth/admin-2fa";

type ActionResult = { ok: true } | { ok: false; error: string };

export async function requestAdminStepUpOtp(): Promise<ActionResult> {
  const session = await getCurrentSession();
  if (!session?.user) return { ok: false, error: "Not signed in." };

  const existing = await getChallenge(session.session.token);
  if (existing && Date.now() - existing.createdAt < ADMIN_2FA_RESEND_COOLDOWN_MS) {
    return { ok: false, error: "Please wait a moment before requesting another code." };
  }

  const code = randomInt(0, 1_000_000).toString().padStart(6, "0");
  await setChallenge(session.session.token, { code, attempts: 0, createdAt: Date.now() });

  await sendEmail({
    to: session.user.email,
    subject: "Your Admin Verification Code",
    text: `Your verification code is: ${code}. It expires in 5 minutes.`,
  });

  return { ok: true };
}

export async function verifyAdminStepUpOtp(inputCode: string): Promise<ActionResult> {
  const session = await getCurrentSession();
  if (!session?.user) return { ok: false, error: "Not signed in." };

  const record = await getChallenge(session.session.token);
  if (!record) return { ok: false, error: "Code expired. Request a new one." };

  if (record.attempts >= ADMIN_2FA_MAX_ATTEMPTS) {
    await clearChallenge(session.session.token);
    return { ok: false, error: "Too many attempts. Request a new code." };
  }

  if (record.code !== inputCode.trim()) {
    await setChallenge(session.session.token, { ...record, attempts: record.attempts + 1 });
    return { ok: false, error: "Incorrect code." };
  }

  await clearChallenge(session.session.token);
  await markSessionTwoFactorVerified(session.session.token);
  return { ok: true };
}

// Called right after Better Auth's own credential+OTP flow succeeds, so those
// admins don't get hit with a second, redundant challenge from this system.
export async function markCurrentSessionAsStepUpVerified(): Promise<void> {
  const session = await getCurrentSession();
  if (session?.user) {
    await markSessionTwoFactorVerified(session.session.token);
  }
}