import { Suspense } from "react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { BrandLogo } from "@/components/brand/BrandLogo";
import { signOutFromApp } from "@/app/actions/auth";
import { isLocale, type Locale } from "@/lib/i18n";

const messages = {
  en: {
    title: "Your workspace is ready for the next step.",
    description:
      "You are signed in. Organization setup, deployments, and assessments will appear here as those features are connected.",
    signedIn: "Signed in as",
    signOut: "Sign out",
    back: "Back to CiviBastion",
    status: "Authentication is connected",
    statusNote: "This session is protected by an encrypted Auth.js JWT cookie.",
  },
  sw: {
    title: "Eneo lako la kazi liko tayari kwa hatua inayofuata.",
    description:
      "Umeingia. Usanidi wa shirika, mifumo na ukaguzi utaonekana hapa vipengele hivyo vitakapounganishwa.",
    signedIn: "Umeingia kama",
    signOut: "Toka",
    back: "Rudi CiviBastion",
    status: "Uthibitishaji umeunganishwa",
    statusNote: "Kipindi hiki kinalindwa na kidakuzi cha JWT kilichosimbwa cha Auth.js.",
  },
} satisfies Record<
  "en" | "sw",
  {
    title: string;
    description: string;
    signedIn: string;
    signOut: string;
    back: string;
    status: string;
    statusNote: string;
  }
>;

export default function DashboardPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  return (
    <Suspense fallback={<DashboardFallback />}>
      <LocalizedDashboard params={params} />
    </Suspense>
  );
}

async function LocalizedDashboard({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale: routeLocale } = await params;

  if (!isLocale(routeLocale)) {
    notFound();
  }

  return (
    <Suspense
      fallback={<DashboardFallback locale={routeLocale} />}
    >
      <AuthenticatedDashboard locale={routeLocale} />
    </Suspense>
  );
}

function DashboardFallback({ locale }: { locale?: Locale }) {
  return (
    <main className="grid min-h-screen place-items-center bg-background px-5">
      <p className="text-sm text-muted-foreground" role="status">
        {locale === "sw"
          ? "Inapakia eneo lako la kazi…"
          : locale === "en"
            ? "Loading your workspace…"
            : "Loading… / Inapakia…"}
      </p>
    </main>
  );
}

async function AuthenticatedDashboard({ locale }: { locale: Locale }) {
  const session = await auth();

  if (!session?.user) {
    redirect(`/${locale}/sign-in`);
  }

  const copy = messages[locale];

  return (
    <main className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-5 px-5 py-5 sm:px-8">
          <Link aria-label="CiviBastion home" href={`/${locale}`}>
            <BrandLogo className="h-10 w-auto" />
          </Link>
          <div className="flex items-center gap-3">
            <span className="hidden max-w-64 truncate text-sm text-muted-foreground sm:block">
              {session.user.name ?? session.user.email}
            </span>
            <form action={signOutFromApp}>
              <input name="locale" type="hidden" value={locale} />
              <button
                className="min-h-10 rounded-full border border-border px-4 text-sm font-semibold transition-colors hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                type="submit"
              >
                {copy.signOut}
              </button>
            </form>
          </div>
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-5 py-16 sm:px-8 sm:py-24">
        <div className="max-w-3xl">
          <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-secondary-foreground">
            {copy.status}
          </span>
          <h1 className="mt-6 text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
            {copy.title}
          </h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">{copy.description}</p>
          <div className="mt-9 rounded-2xl border border-border bg-card p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-muted-foreground">
              {copy.signedIn}
            </p>
            <p className="mt-2 break-all text-base font-medium">
              {session.user.email ?? session.user.name}
            </p>
            <p className="mt-4 text-sm text-muted-foreground">{copy.statusNote}</p>
          </div>
          <Link
            className="mt-8 inline-flex min-h-11 items-center rounded-full bg-primary px-5 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90"
            href={`/${locale}`}
          >
            {copy.back}
          </Link>
        </div>
      </section>
    </main>
  );
}
