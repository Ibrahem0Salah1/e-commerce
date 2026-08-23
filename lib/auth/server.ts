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
