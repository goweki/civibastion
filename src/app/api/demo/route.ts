import { z } from "zod";

const agentBaseUrl = "http://127.0.0.1:8785";
const requestSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("run"),
    variant: z.enum(["baseline", "patched"]),
  }),
  z.object({
    action: z.literal("verify"),
    report: z.record(z.string(), z.unknown()),
  }),
]);

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return Response.json(
      { error: "The local demo is available in development only." },
      { status: 404 },
    );
  }

  try {
    const response = await fetch(`${agentBaseUrl}/v1/health`, {
      cache: "no-store",
      signal: AbortSignal.timeout(3_000),
    });
    const payload: unknown = await response.json();
    return Response.json(payload, { status: response.status });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The local demo agent could not be reached.";
    return Response.json(
      { error: `Local agent unavailable: ${message}` },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}

export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return Response.json(
      { error: "The local demo is available in development only." },
      { status: 404 },
    );
  }

  const rawBody = await request.text();
  if (new TextEncoder().encode(rawBody).byteLength > 1_048_576) {
    return Response.json({ error: "Request body exceeds the 1 MiB limit." }, { status: 413 });
  }

  let input: unknown;
  try {
    input = JSON.parse(rawBody);
  } catch {
    return Response.json({ error: "Request body must be valid JSON." }, { status: 400 });
  }

  const parsed = requestSchema.safeParse(input);
  if (!parsed.success) {
    return Response.json({ error: "Unsupported demo action or target variant." }, { status: 400 });
  }

  try {
    const agentPath =
      parsed.data.action === "run" ? "assessments" : "reports/verify";
    const response = await fetch(`${agentBaseUrl}/v1/${agentPath}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        parsed.data.action === "run"
          ? {
              profileId: "demo-web-baseline",
              variant: parsed.data.variant,
            }
          : { report: parsed.data.report },
      ),
      cache: "no-store",
      signal: AbortSignal.timeout(130_000),
    });
    const payload: unknown = await response.json();
    return Response.json(payload, {
      status: response.status,
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "The local demo agent could not complete the request.";
    return Response.json(
      { error: `Local agent unavailable: ${message}` },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
