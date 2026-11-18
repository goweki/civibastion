import { Suspense } from "react";
import { notFound } from "next/navigation";
import { DemoPage } from "@/components/demo/DemoPage";
import { LocaleFallback } from "@/components/locale/LocaleFallback";
import { isLocale } from "@/lib/i18n";

export default function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return (
    <Suspense fallback={<LocaleFallback />}>
      <LocalizedDemoPage params={params} />
    </Suspense>
  );
}

async function LocalizedDemoPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!isLocale(locale)) {
    notFound();
  }

  return <DemoPage locale={locale} />;
}
