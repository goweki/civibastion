"use client";

import Link from "next/link";
import { ArrowLeft, ShieldCheck } from "lucide-react";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { LocaleSwitcher } from "@/components/navigation/LocaleSwitcher";
import { signInWithGoogle } from "@/app/actions/auth";
import type { Locale } from "@/lib/i18n";

const messages = {
  en: {
    signInTitle: "Welcome back",
    signInIntro: "Continue to your CiviBastion workspace.",
    registerTitle: "Start with CiviBastion",
    registerIntro:
      "Use your Google account to continue. You can create an organization in your workspace after signing in.",
    google: "Continue with Google",
    note: "Google sign-in must be configured by the site administrator before this can be used.",
    privacy:
      "Your Google account is used to establish your identity. CiviBastion does not receive your Google password.",
    switchSignIn: "Already have access? Sign in",
    switchRegister: "New to CiviBastion? Get started",
    home: "Back to home",
    security: "Open security infrastructure for sovereign AI",
  },
  sw: {
    signInTitle: "Karibu tena",
    signInIntro: "Endelea kwenye eneo lako la kazi la CiviBastion.",
    registerTitle: "Anza na CiviBastion",
    registerIntro:
      "Tumia akaunti yako ya Google kuendelea. Unaweza kuunda shirika kwenye eneo lako la kazi baada ya kuingia.",
    google: "Endelea kwa Google",
    note: "Msimamizi wa tovuti anahitaji kusanidi Google kabla ya kutumia njia hii.",
    privacy:
      "Akaunti yako ya Google hutumika kuthibitisha utambulisho wako. CiviBastion haipokei nenosiri lako la Google.",
    switchSignIn: "Una ruhusa tayari? Ingia",
    switchRegister: "Mpya CiviBastion? Anza",
    home: "Rudi mwanzo",
    security: "Miundombinu huria ya usalama kwa AI huru",
  },
} satisfies Record<
  Locale,
  {
    signInTitle: string;
    signInIntro: string;
    registerTitle: string;
    registerIntro: string;
    google: string;
    note: string;
    privacy: string;
    switchSignIn: string;
    switchRegister: string;
    home: string;
    security: string;
  }
>;

type AuthEntryPageProps = {
  locale: Locale;
  mode: "sign-in" | "register";
};

export function AuthEntryPage({ locale, mode }: AuthEntryPageProps) {
  const copy = messages[locale];
  const isRegister = mode === "register";

  return (
    <main className="grid min-h-screen bg-background lg:grid-cols-[1.05fr_0.95fr]">
      <section className="relative hidden overflow-hidden bg-primary p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between xl:p-16">
        <div className="absolute -right-28 -top-28 size-96 rounded-full border border-white/10" />
        <div className="absolute -bottom-40 -left-20 size-[30rem] rounded-full border border-white/10" />
        <Link className="relative z-10 w-fit rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white" href={`/${locale}`}>
          <BrandLogo className="h-12 w-auto brightness-0 invert" priority />
        </Link>
        <div className="relative z-10 max-w-xl pb-8">
          <ShieldCheck aria-hidden="true" className="size-10 text-brand-sage" />
          <p className="mt-6 text-sm font-semibold uppercase tracking-[0.16em] text-primary-foreground/70">
            CIVIBASTION
          </p>
          <h1 className="mt-3 text-4xl font-semibold leading-tight tracking-[-0.04em] xl:text-5xl">
            {copy.security}
          </h1>
        </div>
        <p className="relative z-10 text-xs text-primary-foreground/60">
          {locale === "en" ? "Your infrastructure. Your decisions." : "Miundombinu yako. Maamuzi yako."}
        </p>
      </section>

      <section className="flex min-h-screen flex-col px-5 py-6 sm:px-10 lg:px-14 xl:px-20">
        <div className="flex items-center justify-between gap-4">
          <Link
            aria-label={copy.home}
            className="rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ring lg:invisible"
            href={`/${locale}`}
          >
            <BrandLogo className="h-10 w-auto" priority />
          </Link>
          <LocaleSwitcher locale={locale} />
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12">
          <Link
            className="inline-flex w-fit items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground"
            href={`/${locale}`}
          >
            <ArrowLeft aria-hidden="true" className="size-4" />
            {copy.home}
          </Link>
          <h2 className="mt-8 text-3xl font-semibold tracking-tight">
            {isRegister ? copy.registerTitle : copy.signInTitle}
          </h2>
          <p className="mt-3 leading-7 text-muted-foreground">
            {isRegister ? copy.registerIntro : copy.signInIntro}
          </p>

          <form action={signInWithGoogle} className="mt-8">
            <input name="locale" type="hidden" value={locale} />
            <button
              className="flex min-h-12 w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 text-sm font-semibold text-foreground shadow-sm transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              type="submit"
            >
              <span aria-hidden="true" className="grid size-5 place-items-center rounded-full border border-border text-xs font-bold text-primary">G</span>
              {copy.google}
            </button>
          </form>

          <p className="mt-4 text-center text-xs leading-5 text-muted-foreground">{copy.note}</p>
          <div className="mt-8 rounded-2xl bg-secondary/70 p-4">
            <p className="text-xs leading-5 text-secondary-foreground">{copy.privacy}</p>
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            {isRegister ? copy.switchSignIn : copy.switchRegister}{" "}
            <Link
              className="font-semibold text-primary underline-offset-4 hover:underline"
              href={`/${locale}/${isRegister ? "sign-in" : "register"}`}
            >
              {isRegister ? copy.signInTitle : copy.registerTitle}
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}
