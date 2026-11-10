"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/lib/i18n";

const labels = {
  en: { accessible: "Change language, current language English", short: "EN" },
  sw: {
    accessible: "Badili lugha, lugha ya sasa ni Kiswahili",
    short: "SW",
  },
} satisfies Record<Locale, { accessible: string; short: string }>;

type LocaleSwitcherProps = {
  locale: Locale;
};

export function LocaleSwitcher({ locale }: LocaleSwitcherProps) {
  const pathname = usePathname();
  const nextLocale = locale === "en" ? "sw" : "en";
  const currentPrefix = `/${locale}`;
  const remainder = pathname.startsWith(currentPrefix)
    ? pathname.slice(currentPrefix.length)
    : "";
  const href = `/${nextLocale}${remainder}`;

  return (
    <Link
      aria-label={labels[locale].accessible}
      className="inline-flex min-h-10 items-center rounded-full border border-border px-3 text-xs font-bold tracking-wide text-foreground transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
      href={href}
      hrefLang={nextLocale}
    >
      {labels[nextLocale].short}
    </Link>
  );
}
