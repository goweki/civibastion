# Local demo target

The local agent starts two copies of this deliberately small fixture:

- `baseline`: an older Express dependency and no response-hardening headers.
- `patched`: a newer dependency and the two headers checked by the profile.

Both servers bind only to `127.0.0.1`. They contain no real data, credentials,
or AI model. The demo profile runs `npm audit`, creates a CycloneDX SBOM from
the lockfile, and checks `/health` and the required response headers. It does
not exploit vulnerabilities or accept arbitrary targets.

The fixture uses npm's public audit data. Its results can change as that data
changes, and the report records scanner versions and the profile version.
