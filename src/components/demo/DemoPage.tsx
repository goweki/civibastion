"use client";

import { useEffect, useState } from "react";
import { Check, CircleAlert, Download, LoaderCircle, Play, ShieldCheck } from "lucide-react";
import { z } from "zod";
import type { Locale } from "@/lib/i18n";

type DemoVariant = "baseline" | "patched";

const agentStatusSchema = z.object({
  status: z.literal("ok"),
  agentVersion: z.string(),
  profile: z.object({ id: z.string(), version: z.string() }),
  variants: z.array(z.string()),
  targets: z.array(z.object({ variant: z.string(), port: z.number() })),
});

// Preserve unknown server fields because report verification covers the original payload.
const reportSchema = z.object({
  schemaVersion: z.string(),
  assessmentId: z.string(),
  profile: z.object({
    id: z.string(),
    version: z.string(),
    checks: z.array(z.string()),
  }).passthrough(),
  target: z.object({
    name: z.string(),
    variant: z.enum(["baseline", "patched"]),
    scope: z.array(z.string()),
  }).passthrough(),
  execution: z.object({
    startedAt: z.string(),
    completedAt: z.string(),
    agentVersion: z.string(),
    npmVersion: z.string(),
    nodeVersion: z.string(),
  }).passthrough(),
  checks: z.array(
    z.object({
      id: z.string(),
      status: z.enum(["pass", "fail", "skipped", "error"]),
      summary: z.string(),
      evidence: z
        .object({
          counts: z.record(z.string(), z.number()).optional(),
          findings: z
            .array(
              z.object({
                package: z.string(),
                severity: z.string(),
                range: z.string().optional(),
                references: z.array(
                  z.object({
                    title: z.string().optional(),
                    url: z.string().optional(),
                  }).passthrough(),
                ),
              }).passthrough(),
            )
            .optional(),
          componentCount: z.number().optional(),
          sha256: z.string().optional(),
          missingOrIncorrect: z.array(z.string()).optional(),
          targetMode: z.string().optional(),
          file: z.string().optional(),
          database: z.string().optional(),
          truncated: z.boolean().optional(),
        }).passthrough()
        .optional(),
    }).passthrough(),
  ),
  limitations: z.array(z.string()),
  integrity: z.object({
    algorithm: z.string(),
    digest: z.string(),
    publicKey: z.string(),
    signature: z.string(),
  }).passthrough(),
}).passthrough();

const runResponseSchema = z.object({ report: reportSchema });
const verifyResponseSchema = z.object({
  valid: z.boolean(),
  reason: z.string().optional(),
});

type AssessmentReport = z.infer<typeof reportSchema>;
type AgentStatus = z.infer<typeof agentStatusSchema>;

const copy = {
  en: {
    eyebrow: "Working local prototype",
    title: "Run the same reviewed profile before and after a change.",
    intro:
      "This local-only demo checks a bundled sample service and its locked dependencies. It does not scan your AI systems or contact any target you provide.",
    profile: "Assessment profile",
    profileName: "Local web service baseline",
    profileDescription:
      "Checks the sample health endpoint, response headers, npm advisories, and a CycloneDX software inventory.",
    baseline: "Baseline sample",
    patched: "Patched sample",
    baselineHint: "Older dependency and missing response-hardening headers.",
    patchedHint: "Updated dependency and required response-hardening headers.",
    run: "Run approved checks",
    running: "Running local checks…",
    agentReady: "Local agent connected",
    agentOffline: "Local agent not connected",
    startAgent: "Start the agent and demo instructions",
    instruction: "From the repository root, install the agent requirements, then run:",
    command:
      "python3 -m venv .venv-agent\nsource .venv-agent/bin/activate\npython -m pip install -e ./agent\npython -m civibastion_agent.server",
    result: "Assessment report",
    verify: "Verify signature",
    verifying: "Verifying…",
    verified: "Digest and signature verified",
    invalid: "Report verification failed",
    download: "Download JSON report",
    noReport: "Run the local profile to create a signed report.",
    check: "Check",
    status: "Status",
    details: "Result",
    evidence: "Evidence",
    limitations: "Limitations",
    copyFailure: "The local agent request failed.",
    publicKeyNote:
      "The report includes the demo key's public key. Verification proves the report matches that key; it does not establish an independently trusted organizational identity.",
    noImage:
      "This demo checks a source dependency lockfile, not a built container image. Docker is not required for this local workflow.",
    back: "Results are local to this machine. No credentials, datasets, or model weights are collected.",
  },
  sw: {
    eyebrow: "Mfano wa ndani unaofanya kazi",
    title: "Endesha wasifu uleule uliokaguliwa kabla na baada ya mabadiliko.",
    intro:
      "Mfano huu wa ndani hukagua huduma ya majaribio na utegemezi wake uliofungwa. Hauchunguzi mifumo yako ya AI wala kuwasiliana na lengwa unalotoa.",
    profile: "Wasifu wa tathmini",
    profileName: "Ukaguzi wa msingi wa huduma ya wavuti ya ndani",
    profileDescription:
      "Hukagua njia ya afya ya huduma ya majaribio, vichwa vya majibu, arifa za npm na orodha ya CycloneDX.",
    baseline: "Mfano wa awali",
    patched: "Mfano uliorekebishwa",
    baselineHint: "Utegemezi wa zamani na vichwa vya usalama vinavyokosekana.",
    patchedHint: "Utegemezi uliosasishwa na vichwa vya usalama vinavyotakiwa.",
    run: "Endesha ukaguzi ulioidhinishwa",
    running: "Ukaguzi wa ndani unaendelea…",
    agentReady: "Wakala wa ndani umeunganishwa",
    agentOffline: "Wakala wa ndani hajaunganishwa",
    startAgent: "Maelekezo ya kuanzisha wakala na mfano",
    instruction: "Kutoka kwenye mzizi wa hazina, sakinisha mahitaji ya wakala kisha endesha:",
    command:
      "python3 -m venv .venv-agent\nsource .venv-agent/bin/activate\npython -m pip install -e ./agent\npython -m civibastion_agent.server",
    result: "Ripoti ya tathmini",
    verify: "Thibitisha sahihi",
    verifying: "Inathibitisha…",
    verified: "Muhtasari na sahihi vimethibitishwa",
    invalid: "Uthibitishaji wa ripoti umeshindwa",
    download: "Pakua ripoti ya JSON",
    noReport: "Endesha wasifu wa ndani ili kuunda ripoti iliyosainiwa.",
    check: "Ukaguzi",
    status: "Hali",
    details: "Matokeo",
    evidence: "Ushahidi",
    limitations: "Mipaka",
    copyFailure: "Ombi kwa wakala wa ndani limeshindwa.",
    publicKeyNote:
      "Ripoti ina ufunguo wa umma wa mfano. Uthibitishaji unaonyesha kuwa ripoti inalingana na ufunguo huo; hauthibitishi utambulisho wa shirika unaoaminika kwa kujitegemea.",
    noImage:
      "Mfano huu hukagua faili ya utegemezi, si picha ya kontena iliyojengwa. Mtiririko huu wa ndani hauhitaji Docker.",
    back: "Matokeo hubaki kwenye kompyuta hii. Hakuna siri, data au uzani wa modeli unaokusanywa.",
  },
} satisfies Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    intro: string;
    profile: string;
    profileName: string;
    profileDescription: string;
    baseline: string;
    patched: string;
    baselineHint: string;
    patchedHint: string;
    run: string;
    running: string;
    agentReady: string;
    agentOffline: string;
    startAgent: string;
    instruction: string;
    command: string;
    result: string;
    verify: string;
    verifying: string;
    verified: string;
    invalid: string;
    download: string;
    noReport: string;
    check: string;
    status: string;
    details: string;
    evidence: string;
    limitations: string;
    copyFailure: string;
    publicKeyNote: string;
    noImage: string;
    back: string;
  }
>;

type DemoPageProps = {
  locale: Locale;
};

export function DemoPage({ locale }: DemoPageProps) {
  const messages = copy[locale];
  const [status, setStatus] = useState<AgentStatus | null>(null);
  const [variant, setVariant] = useState<DemoVariant>("baseline");
  const [report, setReport] = useState<AssessmentReport | null>(null);
  const [verification, setVerification] = useState<boolean | null>(null);
  const [busy, setBusy] = useState<"run" | "verify" | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    async function checkStatus() {
      try {
        const response = await fetch("/api/demo", { cache: "no-store" });
        const payload: unknown = await response.json();
        const parsed = agentStatusSchema.safeParse(payload);
        if (!active) return;
        if (!response.ok || !parsed.success) {
          setStatus(null);
          setError(
            !parsed.success && typeof payload === "object" && payload !== null && "error" in payload
              ? String(payload.error)
              : messages.agentOffline,
          );
          return;
        }
        setStatus(parsed.data);
        setError(null);
      } catch {
        if (!active) return;
        setStatus(null);
        setError(messages.agentOffline);
      }
    }

    void checkStatus();
    return () => {
      active = false;
    };
  }, [messages.agentOffline]);

  async function runAssessment() {
    setBusy("run");
    setError(null);
    setReport(null);
    setVerification(null);
    try {
      const response = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "run", variant }),
      });
      const payload: unknown = await response.json();
      const parsed = runResponseSchema.safeParse(payload);
      if (!response.ok || !parsed.success) {
        const errorMessage =
          typeof payload === "object" && payload !== null && "error" in payload
            ? String(payload.error)
            : messages.copyFailure;
        throw new Error(errorMessage);
      }
      setReport(parsed.data.report);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : messages.copyFailure);
    } finally {
      setBusy(null);
    }
  }

  async function verifyReport() {
    if (!report) return;
    setBusy("verify");
    setError(null);
    try {
      const response = await fetch("/api/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "verify", report }),
      });
      const payload: unknown = await response.json();
      const parsed = verifyResponseSchema.safeParse(payload);
      if (!response.ok || !parsed.success) {
        const errorMessage =
          typeof payload === "object" && payload !== null && "error" in payload
            ? String(payload.error)
            : messages.copyFailure;
        throw new Error(errorMessage);
      }
      setVerification(parsed.data.valid);
      if (!parsed.data.valid) setError(parsed.data.reason ?? messages.invalid);
    } catch (caught) {
      setVerification(false);
      setError(caught instanceof Error ? caught.message : messages.copyFailure);
    } finally {
      setBusy(null);
    }
  }

  const selectedHint = variant === "baseline" ? messages.baselineHint : messages.patchedHint;

  return (
    <main className="mx-auto w-full max-w-6xl px-5 py-12 sm:px-8 sm:py-16">
      <header className="max-w-3xl">
        <p className="text-sm font-bold uppercase tracking-[0.15em] text-brand-clay-foreground">
          {messages.eyebrow}
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight tracking-[-0.04em] sm:text-5xl">
          {messages.title}
        </h1>
        <p className="mt-5 text-lg leading-8 text-muted-foreground">{messages.intro}</p>
      </header>

      <div className="mt-8 flex flex-wrap items-center gap-3" aria-live="polite">
        <span
          className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-sm font-semibold ${
            status ? "bg-secondary text-secondary-foreground" : "bg-muted text-muted-foreground"
          }`}
        >
          <span aria-hidden="true" className={`size-2 rounded-full ${status ? "bg-primary" : "bg-muted-foreground"}`} />
          {status ? messages.agentReady : messages.agentOffline}
        </span>
        {status && (
          <span className="text-sm text-muted-foreground">
            {status.profile.id} · v{status.profile.version}
          </span>
        )}
      </div>

      <section className="mt-8 grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <h2 className="text-xl font-semibold">{messages.profile}</h2>
          <h3 className="mt-4 text-lg font-semibold text-primary">{messages.profileName}</h3>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{messages.profileDescription}</p>
          <div className="mt-6 grid gap-3">
            {(["baseline", "patched"] as const).map((value) => (
              <label
                className={`flex cursor-pointer gap-3 rounded-2xl border p-4 ${
                  variant === value ? "border-primary bg-secondary/60" : "border-border"
                }`}
                key={value}
              >
                <input
                  checked={variant === value}
                  className="mt-1 accent-primary"
                  name="demo-variant"
                  onChange={() => setVariant(value)}
                  type="radio"
                  value={value}
                />
                <span>
                  <span className="block font-semibold">
                    {value === "baseline" ? messages.baseline : messages.patched}
                  </span>
                  <span className="mt-1 block text-sm leading-5 text-muted-foreground">
                    {value === "baseline" ? messages.baselineHint : messages.patchedHint}
                  </span>
                </span>
              </label>
            ))}
          </div>
          <button
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            disabled={!status || busy !== null}
            onClick={() => void runAssessment()}
            type="button"
          >
            {busy === "run" ? (
              <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
            ) : (
              <Play aria-hidden="true" className="size-4" />
            )}
            {busy === "run" ? messages.running : messages.run}
          </button>
          {!status && (
            <details className="mt-5 rounded-2xl bg-muted/70 p-4">
              <summary className="cursor-pointer text-sm font-semibold">{messages.startAgent}</summary>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">{messages.instruction}</p>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-background p-3 text-xs">
                <code>{messages.command}</code>
              </pre>
            </details>
          )}
          <p className="mt-5 text-xs leading-5 text-muted-foreground">{messages.noImage}</p>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{messages.result}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{selectedHint}</p>
            </div>
            {report && (
              <a
                className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                download={`civibastion-${report.assessmentId}.json`}
                href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(report, null, 2))}`}
              >
                <Download aria-hidden="true" className="size-4" />
                {messages.download}
              </a>
            )}
          </div>

          {error && (
            <p className="mt-5 flex items-start gap-2 rounded-xl border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive" role="alert">
              <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
              <span>{error}</span>
            </p>
          )}

          {!report ? (
            <p className="mt-8 rounded-2xl bg-muted/60 p-5 text-sm text-muted-foreground" role="status">
              {messages.noReport}
            </p>
          ) : (
            <>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[32rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-xs uppercase tracking-wide text-muted-foreground">
                      <th className="py-3 pr-3">{messages.check}</th>
                      <th className="py-3 pr-3">{messages.status}</th>
                      <th className="py-3">{messages.details}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.checks.map((check) => (
                      <tr className="border-b border-border/70 align-top" key={check.id}>
                        <th className="py-4 pr-3 font-medium">{check.id}</th>
                        <td className="py-4 pr-3">
                          <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                            check.status === "pass"
                              ? "bg-secondary text-secondary-foreground"
                              : check.status === "fail" || check.status === "error"
                                ? "bg-destructive/10 text-destructive"
                                : "bg-muted text-muted-foreground"
                          }`}>
                            {check.status}
                          </span>
                        </td>
                        <td className="py-4 leading-6">{check.summary}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {report.checks.some((check) => check.evidence?.findings?.length) && (
                <div className="mt-5 rounded-2xl border border-border p-4">
                  <h3 className="text-sm font-semibold">{messages.evidence}</h3>
                  <ul className="mt-3 space-y-3">
                    {report.checks.flatMap((check) => check.evidence?.findings ?? []).map((finding) => (
                      <li className="text-sm" key={`${finding.package}-${finding.severity}`}>
                        <strong>{finding.package}</strong> · {finding.severity}
                        {finding.range ? ` · ${finding.range}` : ""}
                        {finding.references.map((reference) =>
                          reference.url ? (
                            <a
                              className="ml-2 text-primary underline"
                              href={reference.url}
                              key={reference.url}
                              rel="noreferrer"
                              target="_blank"
                            >
                              {reference.title ?? reference.url}
                            </a>
                          ) : null,
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-3">
                <button
                  className="inline-flex min-h-10 items-center gap-2 rounded-full border border-border px-4 text-sm font-semibold hover:bg-muted disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                  disabled={busy !== null}
                  onClick={() => void verifyReport()}
                  type="button"
                >
                  {busy === "verify" ? (
                    <LoaderCircle aria-hidden="true" className="size-4 animate-spin" />
                  ) : (
                    <ShieldCheck aria-hidden="true" className="size-4" />
                  )}
                  {busy === "verify" ? messages.verifying : messages.verify}
                </button>
                {verification === true && (
                  <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary" role="status">
                    <Check aria-hidden="true" className="size-4" />
                    {messages.verified}
                  </span>
                )}
                {verification === false && (
                  <span className="text-sm font-semibold text-destructive" role="status">
                    {messages.invalid}
                  </span>
                )}
              </div>

              <p className="mt-4 break-all text-xs leading-5 text-muted-foreground">
                SHA-256: {report.integrity.digest}
              </p>
              <p className="mt-3 text-xs leading-5 text-muted-foreground">{messages.publicKeyNote}</p>

              <div className="mt-6">
                <h3 className="text-sm font-semibold">{messages.limitations}</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-5 text-muted-foreground">
                  {report.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
                </ul>
              </div>
            </>
          )}
        </div>
      </section>

      <p className="mt-8 text-center text-sm text-muted-foreground">{messages.back}</p>
    </main>
  );
}
