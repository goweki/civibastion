"use client";

import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { BrandLogo } from "@/components/brand/BrandLogo";

const messages = {
  en: {
    summary: "Open security infrastructure for sovereign AI.",
    note: "Built for organizations that want to stay in control.",
    about: "Our purpose",
    how: "How it works",
    privacy: "Your infrastructure. Your decisions.",
  },
  sw: {
    summary: "Miundombinu huria ya usalama kwa AI huru.",
    note: "Kwa mashirika yanayotaka kuendelea kuwa na udhibiti.",
    about: "Kuhusu sisi",
    how: "Jinsi inavyofanya kazi",
    privacy: "Miundombinu yako. Maamuzi yako.",
  },
} satisfies Record<
  Locale,
  {
    summary: string;
    note: string;
    about: string;
    how: string;
    privacy: string;
  }
>;

type SiteFooterProps = {
  locale: Locale;
};

export function SiteFooter({ locale }: SiteFooterProps) {
  const copy = messages[locale];

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-8 px-5 py-10 sm:px-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <BrandLogo className="h-9 w-auto" />
          <p className="mt-4 max-w-md text-sm text-muted-foreground">{copy.summary}</p>
          <p className="mt-1 text-xs text-muted-foreground">{copy.note}</p>
        </div>
        <div className="flex flex-col gap-3 text-sm md:items-end">
          <div className="flex gap-5 font-medium">
            <Link className="hover:text-primary" href={`/${locale}/how-it-works`}>
              {copy.how}
            </Link>
            <Link className="hover:text-primary" href={`/${locale}/about`}>
              {copy.about}
            </Link>
          </div>
          <p className="text-xs text-muted-foreground">{copy.privacy}</p>
        </div>
      </div>
    </footer>
  );
}
