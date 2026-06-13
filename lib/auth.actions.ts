"use server";

import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { signInSchema, signUpSchema } from "@/lib/types";
import { redirect } from "next/navigation";
import { APIError } from "better-auth/api";

export async function signInAction(email: string, password: string) {
  // validate on server too — never trust the client alone
  const parsed = signInSchema.safeParse({ email, password });
  if (!parsed.success) {
    return { error: parsed.error.message };
  }

  try {
    await auth.api.signInEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
        callbackURL: "/",
      },
      headers: await headers(),
    });
  } catch (e) {
    console.log(e);
    if (e instanceof APIError) {
      switch (e.status) {
        case "UNAUTHORIZED":
          return { error: "Invalid email or password" };
        case "TOO_MANY_REQUESTS":
          return { error: "Too many attempts. Please wait and try again." };
        default:
          return { error: "Something went wrong. Please try again." };
      }
    }
    return { error: "Something went wrong. Please try again." };
  }

  redirect("/");
}

export async function signUpAction(
  name: string,
  email: string,
  password: string,
) {
  const parsed = signUpSchema.safeParse({ name, email, password });
  if (!parsed.success) {
    return { error: parsed.error.message };
  }

  try {
    await auth.api.signUpEmail({
      body: {
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        callbackURL: "/",
      },
      headers: await headers(),
    });
  } catch (e) {
    console.log(e);
    if (e instanceof APIError) {
      switch (e.status) {
        case "UNPROCESSABLE_ENTITY":
          return { error: "An account with this email already exists." };
        default:
          return { error: "Something went wrong. Please try again." };
      }
    }
    console.log(e);
  }

  redirect("/");
}

export async function signOutAction() {
  await auth.api.signOut({ headers: await headers() });
  redirect("/");
}
