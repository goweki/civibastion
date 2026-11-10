"use client";

import Link from "next/link";
import { ArrowRight, HeartHandshake, Landmark, ShieldCheck } from "lucide-react";
import type { Locale } from "@/lib/i18n";

const messages = {
  en: {
    eyebrow: "Our purpose",
    title: "AI independence needs the ability to care for what we build.",
    intro:
      "CiviBastion is an open-source effort to make security and maintenance more practical for organizations that run AI with limited resources.",
    missionTitle: "A shared capability, not a closed service",
    mission:
      "We bring existing security tools into a local-first workflow, make assessment evidence understandable, and support organizations in retaining control of their infrastructure and decisions.",
    values: [
      {
        title: "Local agency",
        body: "Organizations choose what to assess and what evidence to share.",
      },
      {
        title: "Open practice",
        body: "Tools and assessment methods should be reviewable and reusable.",
      },
      {
        title: "Designed with people",
        body: "SMEs and marginalized communities should shape usability and language—not just receive a finished product.",
      },
    ],
    peopleTitle: "Built for teams outside the security bubble",
    people:
      "We are designing for small businesses, civil society, research groups, and local-language AI initiatives. Their time, connectivity, budget, language, and accessibility needs are product requirements.",
    cta: "See how it works",
  },
  sw: {
    eyebrow: "Dhamira yetu",
    title: "Uhuru wa AI unahitaji uwezo wa kutunza tunachojenga.",
    intro:
      "CiviBastion ni juhudi huria ya kufanya usalama na matengenezo yawe rahisi zaidi kwa mashirika yanayoendesha AI kwa rasilimali chache.",
    missionTitle: "Uwezo wa pamoja, si huduma iliyofungwa",
    mission:
      "Tunaunganisha zana zilizopo za usalama katika mtiririko wa ndani, kufanya ushahidi wa ukaguzi ueleweke na kusaidia mashirika kudhibiti miundombinu na maamuzi yao.",
    values: [
      {
        title: "Udhibiti wa ndani",
        body: "Mashirika huchagua cha kukagua na ushahidi wa kushiriki.",
      },
      {
        title: "Uwazi",
        body: "Zana na mbinu za ukaguzi zinapaswa kuchunguzwa na kutumiwa tena.",
      },
      {
        title: "Imeundwa pamoja na watu",
        body: "Biashara ndogo na jamii zilizotengwa zinapaswa kuongoza matumizi na lugha—si kupokea tu bidhaa iliyokamilika.",
      },
    ],
    peopleTitle: "Kwa timu zilizo nje ya ulimwengu wa wataalamu wa usalama",
    people:
      "Tunabuni kwa biashara ndogo, mashirika ya kiraia, vikundi vya utafiti na miradi ya AI ya lugha za eneo. Muda, muunganisho, bajeti, lugha na mahitaji ya ufikivu ni mahitaji ya bidhaa.",
    cta: "Angalia jinsi inavyofanya kazi",
  },
} satisfies Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    intro: string;
    missionTitle: string;
    mission: string;
    values: { title: string; body: string }[];
    peopleTitle: string;
    people: string;
    cta: string;
  }
>;

const icons = [ShieldCheck, Landmark, HeartHandshake];

type AboutPageProps = {
  locale: Locale;
};

export function AboutPage({ locale }: AboutPageProps) {
  const copy = messages[locale];

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
      <section className="max-w-4xl">
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-brand-clay-foreground">
          {copy.eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-6xl">
          {copy.title}
        </h1>
        <p className="mt-6 max-w-3xl text-lg leading-8 text-muted-foreground">{copy.intro}</p>
      </section>

      <section className="mt-16 grid gap-8 rounded-[2rem] bg-primary p-7 text-primary-foreground sm:p-12 lg:grid-cols-[0.75fr_1.25fr] lg:gap-16">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{copy.missionTitle}</h2>
        <p className="text-lg leading-8 text-primary-foreground/85">{copy.mission}</p>
      </section>

      <section className="grid gap-5 py-16 sm:grid-cols-3 sm:py-20">
        {copy.values.map((value, index) => {
          const Icon = icons[index];
          return (
            <article className="rounded-3xl border border-border bg-card p-6 sm:p-8" key={value.title}>
              <Icon aria-hidden="true" className="size-6 text-primary" />
              <h2 className="mt-5 text-xl font-semibold">{value.title}</h2>
              <p className="mt-3 leading-7 text-muted-foreground">{value.body}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-8 border-t border-border pt-12 lg:grid-cols-2 lg:gap-20">
        <h2 className="text-2xl font-semibold tracking-tight sm:text-3xl">{copy.peopleTitle}</h2>
        <div>
          <p className="leading-8 text-muted-foreground">{copy.people}</p>
          <Link
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            href={`/${locale}/how-it-works`}
          >
            {copy.cta}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
