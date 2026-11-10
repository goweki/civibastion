"use server";

import { signIn, signOut } from "@/auth";
import { isLocale } from "@/lib/i18n";

export async function signInWithGoogle(formData: FormData) {
  const locale = formData.get("locale");

  if (!isLocale(typeof locale === "string" ? locale : undefined)) {
    throw new Error("Unsupported locale for sign-in.");
  }

  await signIn("google", { redirectTo: `/${locale}/dashboard` });
}

export async function signOutFromApp(formData: FormData) {
  const locale = formData.get("locale");

  if (!isLocale(typeof locale === "string" ? locale : undefined)) {
    throw new Error("Unsupported locale for sign-out.");
  }

  await signOut({ redirectTo: `/${locale}` });
}
