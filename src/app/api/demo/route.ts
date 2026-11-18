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

  if (request.headers.get("content-type")?.split(";")[0] !== "application/json") {
    return Response.json({ error: "Content-Type must be application/json." }, { status: 415 });
  }

  const reader = request.body?.getReader();
  if (!reader) {
    return Response.json({ error: "A JSON request body is required." }, { status: 400 });
  }
  const chunks: Uint8Array[] = [];
  let bodySize = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    bodySize += value.byteLength;
    if (bodySize > 1_048_576) {
      await reader.cancel();
      return Response.json({ error: "Request body exceeds the 1 MiB limit." }, { status: 413 });
    }
    chunks.push(value);
  }
  const bodyBytes = new Uint8Array(bodySize);
  let offset = 0;
  for (const chunk of chunks) {
    bodyBytes.set(chunk, offset);
    offset += chunk.byteLength;
  }
  const rawBody = new TextDecoder().decode(bodyBytes);

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
