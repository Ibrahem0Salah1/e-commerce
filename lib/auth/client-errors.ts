// lib/auth/client-errors.ts
/**
 * Maps better-auth client errors to the same friendly messages the server
 * actions used to return, so switching forms to authClient keeps UX identical.
 */
export function mapAuthError(
  err: { status?: number | string; message?: string } | null | undefined,
  context: "signin" | "signup",
): string {
  if (!err) return "Something went wrong. Please try again.";

  switch (err.status) {
    case 400:
      return "Invalid email or password";
    case 401:
      return "Invalid email or password";
    case 429:
      return "Too many attempts. Please wait and try again.";
    case 422:
      return context === "signup"
        ? "An account with this email already exists."
        : "Invalid email or password";
    default:
      return err.message ?? "Something went wrong. Please try again.";
  }
}
