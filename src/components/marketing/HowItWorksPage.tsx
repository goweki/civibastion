"use client";

import Link from "next/link";
import { ArrowRight, Check, ClipboardCheck, FileCheck2, MonitorCog } from "lucide-react";
import type { Locale } from "@/lib/i18n";

const messages = {
  en: {
    eyebrow: "A clear, local-first workflow",
    title: "Know what runs. Check what matters. Keep the evidence.",
    intro:
      "CiviBastion connects a local assessment agent with an understandable web console. Your organization approves the scope and controls what is shared.",
    steps: [
      {
        title: "Connect your environment",
        body: "Register a deployment and enroll the local agent with a scoped credential. Review what it can access before installation.",
      },
      {
        title: "Run an approved assessment",
        body: "Choose an assessment profile, confirm its targets, and approve the work. The agent runs established scanners locally within those limits.",
      },
      {
        title: "Review and verify",
        body: "Understand findings, track changes over time, and create a signed report that another party can verify.",
      },
    ],
    safeguardsTitle: "Designed to keep your organization in control",
    safeguards: [
      "The agent initiates outbound communication; the control plane does not open arbitrary connections into your environment.",
      "Assessment tasks map to predefined operations—not arbitrary commands.",
      "Reports document scope and limitations; they do not certify a system as secure.",
    ],
    cta: "Continue with Google",
    footnote: "Google sign-in requires administrator configuration.",
  },
  sw: {
    eyebrow: "Mtiririko wa kazi ulio wazi na wa ndani",
    title: "Jua kinachoendeshwa. Kagua kilicho muhimu. Hifadhi ushahidi.",
    intro:
      "CiviBastion huunganisha wakala wa ukaguzi wa ndani na dashibodi inayoeleweka. Shirika lako huidhinisha wigo na kudhibiti taarifa zinazoshirikiwa.",
    steps: [
      {
        title: "Unganisha mazingira yako",
        body: "Sajili mfumo na uunganishe wakala wa ndani kwa kitambulisho chenye ruhusa maalum. Kagua uwezo wake kabla ya kusakinisha.",
      },
      {
        title: "Fanya ukaguzi ulioidhinishwa",
        body: "Chagua aina ya ukaguzi, thibitisha mifumo lengwa na uidhinishe kazi. Wakala huendesha zana za ukaguzi ndani ya mipaka hiyo.",
      },
      {
        title: "Pitia na uthibitishe",
        body: "Elewa matokeo, fuatilia mabadiliko na tengeneza ripoti iliyosainiwa ambayo wengine wanaweza kuthibitisha.",
      },
    ],
    safeguardsTitle: "Imeundwa ili shirika lako libaki na udhibiti",
    safeguards: [
      "Wakala huanzisha mawasiliano ya kutoka; mfumo mkuu hauanzishi miunganisho holela kuingia kwenye mazingira yako.",
      "Kazi za ukaguzi hutumia hatua zilizoainishwa—si amri holela.",
      "Ripoti hueleza wigo na mipaka; haithibitishi kuwa mfumo uko salama kabisa.",
    ],
    cta: "Endelea kwa Google",
    footnote: "Msimamizi anahitaji kusanidi kuingia kwa Google.",
  },
} satisfies Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    intro: string;
    steps: { title: string; body: string }[];
    safeguardsTitle: string;
    safeguards: string[];
    cta: string;
    footnote: string;
  }
>;

type HowItWorksPageProps = {
  locale: Locale;
};

const icons = [MonitorCog, ClipboardCheck, FileCheck2];

export function HowItWorksPage({ locale }: HowItWorksPageProps) {
  const copy = messages[locale];

  return (
    <main className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 sm:py-24">
      <div className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-brand-clay-foreground">
          {copy.eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">{copy.intro}</p>
      </div>

      <ol className="mt-14 grid gap-5 lg:grid-cols-3">
        {copy.steps.map((step, index) => {
          const Icon = icons[index];
          return (
            <li
              className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8"
              key={step.title}
            >
              <div className="flex size-12 items-center justify-center rounded-2xl bg-secondary text-primary">
                <Icon aria-hidden="true" className="size-5" />
              </div>
              <p className="mt-7 text-xs font-bold uppercase tracking-[0.14em] text-muted-foreground">
                {locale === "en" ? `Step 0${index + 1}` : `Hatua ya 0${index + 1}`}
              </p>
              <h2 className="mt-2 text-xl font-semibold">{step.title}</h2>
              <p className="mt-3 leading-7 text-muted-foreground">{step.body}</p>
            </li>
          );
        })}
      </ol>

      <section className="mt-16 grid gap-10 rounded-[2rem] bg-secondary/70 p-6 sm:p-10 lg:grid-cols-[0.8fr_1.2fr]">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.15em] text-primary">
            CiviBastion
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">{copy.safeguardsTitle}</h2>
        </div>
        <ul className="space-y-4">
          {copy.safeguards.map((item) => (
            <li className="flex gap-3 leading-7" key={item}>
              <Check aria-hidden="true" className="mt-1 size-4 shrink-0 text-primary" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-12 flex flex-col items-start gap-4">
        <Link
          className="inline-flex min-h-12 items-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90"
          href={`/${locale}/register`}
        >
          {copy.cta}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
        <p className="text-xs text-muted-foreground">{copy.footnote}</p>
      </div>
    </main>
  );
}
