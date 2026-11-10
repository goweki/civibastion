import type { Metadata } from "next";
import { Suspense } from "react";
import { AboutPage } from "@/components/marketing/AboutPage";
import { LocaleFallback } from "@/components/locale/LocaleFallback";
import { isLocale } from "@/lib/i18n";
import { notFound } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;

  return locale === "sw"
    ? { title: "Dhamira yetu", description: "Kuhusu dhamira ya CiviBastion." }
    : { title: "Our purpose", description: "Learn about CiviBastion's purpose." };
}

export default function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return (
    <Suspense fallback={<LocaleFallback />}>
      <LocalizedAboutPage params={params} />
    </Suspense>
  );
}

async function LocalizedAboutPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <AboutPage locale={locale} />;
}
