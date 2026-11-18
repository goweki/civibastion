"use client";

import Link from "next/link";
import {
  ArrowDown,
  ArrowRight,
  Check,
  FileCheck2,
  LockKeyhole,
  ScanSearch,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import type { Locale } from "@/lib/i18n";

const messages = {
  en: {
    eyebrow: "Open security infrastructure for sovereign AI",
    title: "Security for the AI you run. Built for the people who do.",
    intro:
      "Practical tools to assess, maintain, and understand AI infrastructure—without giving up control of it.",
    primary: "See how it works",
    secondary: "Get started",
    demo: "Try the working local demo",
    note: "Designed for small teams, community organizations, and independent operators.",
    proofLabel: "A clearer path to responsible AI operations",
    localTitle: "A first local assessment profile",
    localBody:
      "The working demo checks a bundled sample service. Assessing customer deployments is planned, not shipped.",
    evidenceTitle: "Run prescribed checks",
    evidenceBody:
      "The demo runs fixed health, response-header, dependency-advisory, and software-inventory checks.",
    recordTitle: "Verify a demo report",
    recordBody:
      "Download and verify a locally signed report. Its demo key does not establish an organization's identity.",
    sectionEyebrow: "Built around your agency",
    sectionTitle: "Security should not require a specialist team.",
    sectionBody:
      "CiviBastion brings trusted open-source tools into a guided workflow for SMEs and public-interest organizations. Start with a clear inventory, run an authorized check, and make the next step understandable.",
    points: [
      "Self-hostable, open-source foundation",
      "English and Swahili from the start",
      "No automatic changes to production systems",
    ],
    closingTitle: "Keep control of the systems you depend on.",
    closingBody:
      "Build a more understandable security practice around the AI infrastructure you operate.",
    learn: "Learn about our purpose",
    diagramLabel: "A simple, transparent assessment flow",
    steps: ["Your environment", "Local checks", "Evidence you control"],
    footerHint: "No black box. No unsupported security score.",
  },
  sw: {
    eyebrow: "Miundombinu huria ya usalama kwa AI huru",
    title: "Usalama wa AI mnayoendesha, kwa watu wanaoiendesha.",
    intro:
      "Zana za vitendo za kutathmini, kutunza na kuelewa miundombinu ya AI—bila kupoteza udhibiti wake.",
    primary: "Angalia jinsi inavyofanya kazi",
    secondary: "Anza",
    demo: "Jaribu mfano wa ndani unaofanya kazi",
    note: "Imeundwa kwa timu ndogo, mashirika ya jamii na wanaoendesha mifumo yao wenyewe.",
    proofLabel: "Njia iliyo wazi zaidi ya kuendesha AI kwa uwajibikaji",
    localTitle: "Wasifu wa kwanza wa ukaguzi wa ndani",
    localBody:
      "Mfano unaofanya kazi hukagua huduma ya majaribio iliyojumuishwa. Ukaguzi wa mifumo ya wateja bado umepangwa, haujatolewa.",
    evidenceTitle: "Endesha ukaguzi uliopangwa",
    evidenceBody:
      "Mfano huendesha ukaguzi maalum wa afya, vichwa vya majibu, arifa za utegemezi na orodha ya programu.",
    recordTitle: "Thibitisha ripoti ya mfano",
    recordBody:
      "Pakua na uthibitishe ripoti iliyosainiwa ndani. Ufunguo wa mfano hauthibitishi utambulisho wa shirika.",
    sectionEyebrow: "Udhibiti wako kwanza",
    sectionTitle: "Usalama haupaswi kuhitaji timu ya wataalamu.",
    sectionBody:
      "CiviBastion huleta pamoja zana huria zinazoaminika katika hatua zinazoeleweka kwa biashara ndogo na mashirika ya manufaa ya umma. Anza na orodha ya mifumo, fanya ukaguzi ulioidhinishwa, kisha elewa hatua inayofuata.",
    points: [
      "Msingi huria unaoweza kujiendeshea",
      "Kiingereza na Kiswahili tangu mwanzo",
      "Hakuna mabadiliko ya kiotomatiki kwenye mifumo ya uzalishaji",
    ],
    closingTitle: "Endelea kudhibiti mifumo unayoitegemea.",
    closingBody:
      "Jenga utaratibu wa usalama unaoeleweka kwa miundombinu ya AI unayoendesha.",
    learn: "Jifunze kuhusu dhamira yetu",
    diagramLabel: "Hatua za ukaguzi zilizo wazi",
    steps: ["Mazingira yako", "Ukaguzi wa ndani", "Ushahidi unaoudhibiti"],
    footerHint: "Hakuna kisanduku fiche. Hakuna alama ya usalama isiyo na msingi.",
  },
} satisfies Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    intro: string;
    primary: string;
    secondary: string;
    demo: string;
    note: string;
    proofLabel: string;
    localTitle: string;
    localBody: string;
    evidenceTitle: string;
    evidenceBody: string;
    recordTitle: string;
    recordBody: string;
    sectionEyebrow: string;
    sectionTitle: string;
    sectionBody: string;
    points: string[];
    closingTitle: string;
    closingBody: string;
    learn: string;
    diagramLabel: string;
    steps: string[];
    footerHint: string;
  }
>;

type HomePageProps = {
  locale: Locale;
};

export function HomePage({ locale }: HomePageProps) {
  const copy = messages[locale];
  const features = [
    { Icon: LockKeyhole, title: copy.localTitle, body: copy.localBody },
    { Icon: ScanSearch, title: copy.evidenceTitle, body: copy.evidenceBody },
    { Icon: FileCheck2, title: copy.recordTitle, body: copy.recordBody },
  ];

  return (
    <main>
      <section className="relative isolate overflow-hidden">
        <div className="absolute -right-36 -top-40 -z-10 size-[34rem] rounded-full bg-brand-sage/70 blur-3xl" />
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-5 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24 lg:grid-cols-[1.05fr_0.95fr] lg:gap-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-white/80 px-3 py-1.5 text-xs font-semibold tracking-wide text-primary shadow-sm">
              <Sparkles aria-hidden="true" className="size-3.5 text-brand-clay" />
              {copy.eyebrow}
            </div>
            <h1 className="mt-7 max-w-3xl text-4xl font-semibold leading-[1.08] tracking-[-0.045em] text-foreground sm:text-5xl lg:text-6xl">
              {copy.title}
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground sm:text-xl">
              {copy.intro}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                className="inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                href={`/${locale}/how-it-works`}
              >
                {copy.primary}
                <ArrowRight aria-hidden="true" className="size-4" />
              </Link>
              <Link
                className="inline-flex min-h-12 items-center justify-center rounded-full border border-border bg-card px-5 text-sm font-semibold text-foreground transition hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                href={`/${locale}/register`}
              >
                {copy.secondary}
              </Link>
            </div>
            <Link
              className="mt-4 inline-flex min-h-10 items-center text-sm font-semibold text-primary underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              href={`/${locale}/demo`}
            >
              {copy.demo}
            </Link>
            <p className="mt-5 max-w-lg text-sm leading-6 text-muted-foreground">
              {copy.note}
            </p>
          </div>

          <div
            aria-label={copy.diagramLabel}
            className="relative mx-auto w-full max-w-xl rounded-[2rem] border border-border/80 bg-card p-5 shadow-[0_30px_90px_-40px_rgba(18,59,53,0.35)] sm:p-8"
            role="img"
          >
            <div className="flex items-center justify-between border-b border-border pb-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">
                  CIVIBASTION
                </p>
                <p className="mt-1 text-sm font-semibold text-foreground">{copy.proofLabel}</p>
              </div>
              <ShieldCheck aria-hidden="true" className="size-8 text-primary" />
            </div>
            <div className="grid gap-3 py-6">
              {copy.steps.map((step, index) => (
                <div
                  className="flex items-center gap-4 rounded-2xl bg-muted/70 p-4"
                  key={step}
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                    {index + 1}
                  </span>
                  <span className="flex-1 text-sm font-semibold text-foreground sm:text-base">
                    {step}
                  </span>
                  {index === 2 ? (
                    <Check aria-hidden="true" className="size-5 text-primary" />
                  ) : (
                    <ArrowDown aria-hidden="true" className="size-4 text-muted-foreground" />
                  )}
                </div>
              ))}
            </div>
            <p className="rounded-xl border border-dashed border-border px-4 py-3 text-center text-xs leading-5 text-muted-foreground">
              {copy.footerHint}
            </p>
            <span className="absolute -bottom-5 -left-5 -z-10 size-28 rounded-full bg-accent" />
          </div>
        </div>
      </section>

      <section className="border-y border-border bg-card">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 sm:py-20 lg:grid-cols-3">
          {features.map(({ Icon, title, body }) => (
            <article className="max-w-md" key={title}>
              <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                <Icon aria-hidden="true" className="size-5" />
              </div>
              <h2 className="mt-5 text-xl font-semibold tracking-tight">{title}</h2>
              <p className="mt-3 leading-7 text-muted-foreground">{body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-12 px-5 py-20 sm:px-8 sm:py-28 lg:grid-cols-[0.8fr_1.2fr] lg:gap-24">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-brand-clay-foreground">
            {copy.sectionEyebrow}
          </p>
          <h2 className="mt-4 text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">
            {copy.sectionTitle}
          </h2>
        </div>
        <div>
          <p className="text-lg leading-8 text-muted-foreground">{copy.sectionBody}</p>
          <ul className="mt-7 space-y-3">
            {copy.points.map((point) => (
              <li className="flex items-start gap-3 text-sm font-medium" key={point}>
                <Check aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-primary" />
                <span>{point}</span>
              </li>
            ))}
          </ul>
          <Link
            className="mt-8 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
            href={`/${locale}/about`}
          >
            {copy.learn}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>

      <section className="mx-5 mb-20 rounded-[2rem] bg-primary px-6 py-12 text-primary-foreground sm:mx-8 sm:mb-28 sm:px-12 sm:py-16 lg:mx-auto lg:max-w-7xl">
        <div className="mx-auto flex max-w-4xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
          <div>
            <h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-[-0.035em] sm:text-4xl">
              {copy.closingTitle}
            </h2>
            <p className="mt-4 max-w-xl leading-7 text-primary-foreground/80">
              {copy.closingBody}
            </p>
          </div>
          <Link
            className="inline-flex min-h-12 shrink-0 items-center gap-2 rounded-full bg-white px-5 text-sm font-semibold text-primary transition hover:bg-brand-sage focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            href={`/${locale}/register`}
          >
            {copy.secondary}
            <ArrowRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>
    </main>
  );
}
