import type { ReactNode } from "react";
import { SiteFooter } from "@/components/navigation/SiteFooter";
import { SiteHeader } from "@/components/navigation/SiteHeader";
import { isLocale, type Locale } from "@/lib/i18n";

export default async function MarketingLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale: routeLocale } = await params;
  const locale: Locale = isLocale(routeLocale) ? routeLocale : "en";

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader locale={locale} />
      <div className="flex-1">{children}</div>
      <SiteFooter locale={locale} />
    </div>
  );
}
