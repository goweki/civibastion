import type { Metadata } from "next";
import { Suspense } from "react";
import { HowItWorksPage } from "@/components/marketing/HowItWorksPage";
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
    ? {
        title: "Jinsi inavyofanya kazi",
        description: "Jinsi CiviBastion inavyokagua miundombinu ya AI ndani.",
      }
    : {
        title: "How it works",
        description: "See how CiviBastion assesses AI infrastructure locally.",
      };
}

export default function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return (
    <Suspense fallback={<LocaleFallback />}>
      <LocalizedHowItWorksPage params={params} />
    </Suspense>
  );
}

async function LocalizedHowItWorksPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <HowItWorksPage locale={locale} />;
}
