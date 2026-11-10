import { Suspense } from "react";
import type { ReactNode } from "react";
import { LocaleFallback } from "@/components/locale/LocaleFallback";
import { SiteFooter } from "@/components/navigation/SiteFooter";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { isLocale, type Locale } from "@/lib/i18n";

export default function MarketingLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  return (
    <div className="flex min-h-screen flex-col">
      <Suspense fallback={<LocaleFallback />}>
        <LocalizedMarketingHeader params={params} />
      </Suspense>
      <div className="flex-1">{children}</div>
      <Suspense fallback={null}>
        <LocalizedMarketingFooter params={params} />
      </Suspense>
    </div>
  );
}

async function LocalizedMarketingHeader({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: routeLocale } = await params;
  const locale: Locale = isLocale(routeLocale) ? routeLocale : "en";

  return <SiteHeader locale={locale} />;
}

async function LocalizedMarketingFooter({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: routeLocale } = await params;
  const locale: Locale = isLocale(routeLocale) ? routeLocale : "en";

  return <SiteFooter locale={locale} />;
}
