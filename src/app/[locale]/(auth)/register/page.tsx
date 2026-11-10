import type { Metadata } from "next";
import { AuthEntryPage } from "@/components/auth/AuthEntryPage";
import { isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: locale === "sw" ? "Anza kutumia" : "Get started",
    robots: { index: false, follow: false },
  };
}

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <AuthEntryPage locale={locale} mode="register" />;
}
