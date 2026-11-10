import type { Metadata } from "next";
import { Suspense } from "react";
import { HomePage } from "@/components/marketing/HomePage";
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
        title: "Usalama wa AI huru",
        description:
          "Zana huria za vitendo kwa mashirika yanayoendesha miundombinu yao ya AI.",
      }
    : {
        title: "Open security infrastructure for sovereign AI",
        description:
          "Practical, open security tools for organizations that operate their own AI infrastructure.",
      };
}

export default function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return (
    <Suspense fallback={<LocaleFallback />}>
      <LocalizedHomePage params={params} />
    </Suspense>
  );
}

async function LocalizedHomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!isLocale(locale)) {
    notFound();
  }

  return <HomePage locale={locale} />;
}
