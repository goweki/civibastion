import type { Metadata } from "next";
import { Suspense } from "react";
import { AuthEntryPage } from "@/components/auth/AuthEntryPage";
import { LocaleFallback } from "@/components/locale/LocaleFallback";
import { isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: locale === "sw" ? "Ingia" : "Sign in",
    robots: { index: false, follow: false },
  };
}

export default function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return (
    <Suspense fallback={<LocaleFallback />}>
      <LocalizedSignInPage params={params} />
    </Suspense>
  );
}

async function LocalizedSignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <AuthEntryPage locale={locale} mode="sign-in" />;
}
