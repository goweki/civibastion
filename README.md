# CiviBastion

Open security infrastructure for organizations that operate their own AI
systems. The current application includes a bilingual public site and
Google-based Auth.js sign-in using encrypted JWT sessions.

## Local development

```bash
npm install
cp .env.template .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root route redirects
to `/en`; the site also supports `/sw`.

## Configure Google sign-in

Create a Google OAuth 2.0 web client and add this authorized redirect URI:

```text
http://localhost:3000/api/auth/callback/google
```

Set these values in `.env.local`:

```text
AUTH_SECRET=<a unique random secret>
AUTH_GOOGLE_ID=<Google OAuth client ID>
AUTH_GOOGLE_SECRET=<Google OAuth client secret>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Generate a secret locally, for example with `openssl rand -base64 32`. Do not
commit `.env.local` or share its values. Set the production redirect URI to
`https://<your-domain>/api/auth/callback/google` in the Google client and use a
separate production secret. Self-hosted deployments behind a reverse proxy
should set `AUTH_TRUST_HOST=true` only when that proxy validates and sets host
headers. Set `NEXT_PUBLIC_SITE_URL` to the canonical HTTPS origin in production
so generated social preview URLs use the correct host.

The initial Auth.js setup uses Google OAuth and JWT sessions. It does not use a
database adapter and does not persist Auth.js users, linked accounts, or
sessions. The session exposes the provider's stable user subject as `user.id`;
application-level organization membership and user records still need to be
implemented before connecting protected product data.

## Try the local assessment demo

The demo is a local-only prototype for a bundled sample service. It runs one
versioned profile against a baseline and a patched variant, checks the live
`/health` response and required security headers, runs npm's dependency audit,
generates a CycloneDX SBOM, and creates a locally signed report. It does not
assess arbitrary hosts, container images, or AI model behavior.

Prepare the isolated sample dependencies:

```bash
npm install --ignore-scripts --no-audit --no-fund --prefix examples/demo-target/baseline
npm install --ignore-scripts --no-audit --no-fund --prefix examples/demo-target/patched
```

In a separate terminal, install and start the local Python agent:

```bash
python3 -m venv .venv-agent
source .venv-agent/bin/activate
python -m pip install -e ./agent
civibastion-demo-agent
```

Then start the web app with `npm run dev` and open
[http://localhost:3000/en/demo](http://localhost:3000/en/demo). The agent and
sample services bind to loopback only. No Docker socket or customer credentials
are used. Assessment JSON, CycloneDX files, and the private demo signing key
are kept under `~/.civibastion-demo/`; protect that directory and remove it
when you want to delete the demo's local data. The demo signing key is not a
production organization key, and the demo report does not prove organizational
identity.

This prototype currently uses npm's audit database rather than the planned
Trivy/Syft/OSV-Scanner workflow. Its dependency check is not a container-image
scan. Do not present this narrow sample as a completed customer deployment
assessment.

## Quality checks

```bash
npm run lint
npx tsc --noEmit
npm run build
```

Agent tests:

```bash
python -m unittest discover -s agent/tests -t agent
```

## Project documents

Working product and engineering specifications, including the brand guide, are
maintained under the ignored `local/docs/` directory. Those documents are
intentionally local and are not included in normal Git commits.
