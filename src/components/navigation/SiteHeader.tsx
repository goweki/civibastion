"use client";

import Link from "next/link";
import type { Locale } from "@/lib/i18n";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { LocaleSwitcher } from "./LocaleSwitcher";

const messages = {
  en: {
    about: "Our purpose",
    how: "How it works",
    demo: "Try local demo",
    signIn: "Sign in",
    getStarted: "Get started",
  },
  sw: {
    about: "Kuhusu sisi",
    how: "Jinsi inavyofanya kazi",
    demo: "Jaribu mfano wa ndani",
    signIn: "Ingia",
    getStarted: "Anza",
  },
} satisfies Record<
  Locale,
  { about: string; how: string; demo: string; signIn: string; getStarted: string }
>;

type SiteHeaderProps = {
  locale: Locale;
};

export function SiteHeader({ locale }: SiteHeaderProps) {
  const copy = messages[locale];

  return (
    <header className="border-b border-border/80 bg-background/90">
      <div className="mx-auto flex min-h-[76px] max-w-7xl items-center justify-between gap-5 px-5 sm:px-8">
        <Link aria-label="CiviBastion home" href={`/${locale}`}>
          <BrandLogo className="h-10 w-auto sm:h-11" priority />
        </Link>
        <nav
          aria-label={locale === "en" ? "Main navigation" : "Urambazaji mkuu"}
          className="hidden items-center gap-8 text-sm font-medium text-muted-foreground md:flex"
        >
          <Link className="transition-colors hover:text-foreground" href={`/${locale}/how-it-works`}>
            {copy.how}
          </Link>
          <Link className="transition-colors hover:text-foreground" href={`/${locale}/demo`}>
            {copy.demo}
          </Link>
          <Link className="transition-colors hover:text-foreground" href={`/${locale}/about`}>
            {copy.about}
          </Link>
        </nav>
        <div className="flex items-center gap-2 sm:gap-3">
          <LocaleSwitcher locale={locale} />
          <Link
            className="hidden min-h-10 items-center rounded-full px-3 text-sm font-semibold text-foreground transition-colors hover:bg-muted sm:inline-flex"
            href={`/${locale}/sign-in`}
          >
            {copy.signIn}
          </Link>
          <Link
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-primary px-4 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            href={`/${locale}/register`}
          >
            {copy.getStarted}
          </Link>
        </div>
      </div>
    </header>
  );
}
