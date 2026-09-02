import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/config/prisma";
import { nextCookies } from "better-auth/next-js";
import { admin, createAccessControl, twoFactor } from "better-auth/plugins";
import { sendEmail } from "@/lib/auth/email-verification";
const baseURL =
  process.env.BETTER_AUTH_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  "http://localhost:3000";

const adminAccessControl = createAccessControl({
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "impersonate-admins",
    "delete",
    "set-password",
    "set-email",
    "get",
    "update",
  ],
  session: ["list", "revoke", "delete"],
});

const userRole = adminAccessControl.newRole({
  user: [],
  session: [],
});

const adminRole = adminAccessControl.newRole({
  user: [
    "create",
    "list",
    "set-role",
    "ban",
    "impersonate",
    "delete",
    "set-password",
    "set-email",
    "get",
    "update",
  ],
  session: ["list", "revoke", "delete"],
});

const googleProvider =
  process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
    ? {
        google: {
          clientId: process.env.GOOGLE_CLIENT_ID,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        },
      }
    : undefined;

export const auth = betterAuth({
  appName: "MDS Dental Store",
  baseURL,
  database: prismaAdapter(prisma, {
    provider: "postgresql",
  }),
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders: googleProvider,
  rateLimit: {
    enabled: true,
    window: 60,
    max: 60,
    customRules: {
      "/sign-in/email": {
        window: 1200,
        max: 3,
      },
      "/sign-up/email": {
        window: 1200,
        max: 3,
      },
      "/two-factor/send-otp": {
        window: 1200,
        max: 3,
      },
      "/two-factor/verify-otp": {
        window: 1200,
        max: 3,
      },
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user: any) => {
          // For ADMINs we must ensure BOTH the boolean flag and the physical two_factors row exist.
          // Better-Auth's OTP verify (otp/index.mjs:213) checks `two_factors` row existence, not just the flag.
          // Previously we only flipped the flag → verify-otp 400 TWO_FACTOR_NOT_ENABLED despite DB true.
          if (user.role !== "ADMIN") return;
          if (!user.twoFactorEnabled) {
            await prisma.user.update({
              where: { id: user.id },
              data: { twoFactorEnabled: true },
            });
          }
          const existing = await prisma.twoFactor.findUnique({
            where: { userId: user.id },
          });
          if (!existing) {
            // OTP flow only needs row existence; secret/backupCodes not used for OTP verify,
            // but we create valid values so TOTP/backup flows also work. Use plain for OTP-only;
            // if you later need encrypted backupCodes, call POST /two-factor/enable which rotates them correctly.
            const { randomBytes } = await import("node:crypto");
            const secret = randomBytes(32).toString("hex");
            const backupCodes = Array.from({ length: 10 }).map(() => {
              const c = randomBytes(5).toString("hex").slice(0, 10).toUpperCase();
              return `${c.slice(0, 5)}-${c.slice(5)}`;
            });
            await prisma.twoFactor.create({
              data: {
                userId: user.id,
                secret,
                backupCodes: JSON.stringify(backupCodes),
                verified: true,
              },
            });
          }
        },
      },
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google", "emailAndPassword"],
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, //
    updateAge: 60 * 60 * 24,
  },
  advanced: {
    defaultCookieAttributes: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
    },
  },
  plugins: [
    admin({
      ac: adminAccessControl,
      provider: "emailAndPassword",
      roles: {
        USER: userRole,
        ADMIN: adminRole,
      },
      defaultRole: "USER",
      adminRoles: ["ADMIN"],
      bannedUserMessage:
        "This account is suspended. Please contact support if you believe this is an error.",
      impersonationSessionDuration: 60 * 30,
    }),
    twoFactor({
      issuer: "MDS Dental Store",
      twoFactorCookieMaxAge: 60 * 10,
      trustDeviceMaxAge: 60 * 60 * 24 * 14,
      otpOptions: {
        async sendOTP({ user, otp }) {
          await sendEmail({
            to: user.email,
            subject: "Your Admin Verification Code",
            text: `Your verification code is: ${otp}`,
          });
        },
        period: 10,
      },
      backupCodeOptions: {
        amount: 10,
        length: 10,
        storeBackupCodes: "encrypted",
      },
    }),
    nextCookies(),
  ],
});
