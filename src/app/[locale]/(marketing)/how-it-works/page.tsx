import type { Metadata } from "next";
import { HowItWorksPage } from "@/components/marketing/HowItWorksPage";
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

export default async function Page({
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
