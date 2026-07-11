import { createAuthClient } from "better-auth/react";
import {
  adminClient,
  twoFactorClient,
  emailOTPClient,
} from "better-auth/client/plugins";

export const authClient = createAuthClient({
  plugins: [
    adminClient(),
    twoFactorClient(),
    emailOTPClient(),
  ],
});

export const { signIn, signUp, signOut, useSession } = authClient;
