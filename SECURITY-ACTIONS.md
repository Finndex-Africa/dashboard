# Security remediation — remaining actions

Most of the original list is now fixed and verified in code across **both** repos
(`dashboard` and `backend`). What's left below needs a human: live credentials and
a shared-history force-push.

---

## 1. Rotate the leaked credentials — the one genuinely urgent item

Three credentials were committed to `.env` and **pushed to `origin`**. They sit on
`origin/main` and every other remote branch, so anyone with repo read access — or
anyone who ever cloned it — has them.

| Credential | Identify by | Where to rotate |
|---|---|---|
| `DO_SPACES_KEY` | starts `DO00` | DigitalOcean → API → Spaces Keys |
| `DO_SPACES_SECRET` | (paired with above) | DigitalOcean → API → Spaces Keys (regenerate pair) |
| `CLOUDINARY_API_KEY` | 15-digit numeric | Cloudinary → Settings → Access Keys |

Leaked in commits `1cfe60e` (2025-11-01), `a304748` and `c272225` (2025-11-11).

**Deleting them from files does not revoke them.** Rotation at the provider is the
only thing that does. Rotate even though this app no longer uses them — they still
grant access to the bucket. While you're there, check DigitalOcean Spaces access
logs for unfamiliar activity since 2025-11-01.

> Values are deliberately not reproduced here. Retrieve with `git show a304748:.env`
> if you need to match them against the provider console.

## 2. Purge them from git history (verified procedure, not yet applied)

I ran this against a throwaway mirror clone and confirmed the result:

- `.env` occurrences in history: **18 → 0**
- all **99** commits and **10** branches preserved
- file listing at HEAD identical; `package.json` blob byte-identical

Not applied to your repo, because the force-push rewrites history for every
teammate's clone — that's your call to coordinate, not mine to make.

```bash
# 1. Tell everyone with a clone to stop pushing.
# 2. Back up first.
git clone --mirror https://github.com/Finndex-Africa/dashboard.git dashboard-backup.git

# 3. Rewrite (git-filter-repo is already installed on this machine).
git filter-repo --force --invert-paths --path .env

# 4. Re-add the remote (filter-repo drops it by design) and force-push.
git remote add origin https://github.com/Finndex-Africa/dashboard.git
git push --force --all && git push --force --tags

# 5. Everyone else re-clones. Do not merge an old clone back in — it reintroduces
#    the secrets.
```

GitHub may retain unreferenced objects, and forks/PR refs keep their own copies.
**Rotation in §1 is what actually protects you; this is cleanup.**

## 3. Set these environment variables before the next deploy

The backend now refuses to start in production without a CORS allowlist, and both
apps validate `JWT_SECRET`. Set these in Netlify / your host, not in a file:

| Var | Where | Notes |
|---|---|---|
| `CORS_ORIGIN` | backend | Comma-separated allowlist. **Required in production** |
| `JWT_SECRET` | backend | Already set. Must be ≥32 chars, not a placeholder |
| `ENABLE_SWAGGER` | backend | Optional. Only if you want API docs public on staging |
| `JWT_SECRET` | dashboard | **Optional** — see §4 before setting |

`.env` gets copied into build output (it lands in `.next/standalone/.env`), so
prefer your host's env-var UI over a file.

## 4. Decide: signature verification on the dashboard

Dashboard middleware now verifies the JWT signature **when `JWT_SECRET` is set**,
and falls back to unverified decoding when it isn't. Both paths are tested.

The trade-off is real and it's your call. HS256 is symmetric, so the verifying key
*is* the signing key — setting `JWT_SECRET` on the dashboard copies the API's
signing secret into a second deployment, widening the blast radius if the frontend
host is compromised.

Three options, roughly in order of preference:

1. **Move the API to RS256** and give the dashboard only the public key. Best
   long-term answer; removes the trade-off entirely.
2. **Leave `JWT_SECRET` unset on the dashboard.** The API independently authorizes
   every request — verified below — so this is defensible.
3. **Set it** and accept the secret sprawl for a second enforcement layer.

Verified backend behaviour, which is what makes option 2 safe:

| Request | Result |
|---|---|
| token forged with the old default secret | `401` |
| `admin_property` → `GET /admin/users` | `403` |
| `home_seeker` → `GET /admin/users` | `403` |
| `admin_property` → `GET /admin/properties` | `200` (correct scope) |
| genuine `admin` → `GET /admin/users` | `200` |

## 5. Session tokens are still readable by JavaScript

The token lives in `localStorage` and in a non-`HttpOnly` cookie, because
client-side JS writes it. Any XSS on this origin can steal a live session.

The fix is for the API to set the session itself:

```
Set-Cookie: token=…; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400
```

Then the frontend stops touching the token at all. This is the largest remaining
structural weakness. Until it lands, the CSP is the main thing between an injected
script and your users' sessions.

## 6. Minor

- `pnpm lint` can't run in the dashboard: no ESLint config, so `next lint` drops
  into its interactive setup prompt. Pre-existing. Worth fixing so CI can lint.
- `zod` is a dashboard dependency but unused. Harmless; useful if you add input
  validation later.
- The `output: 'standalone'` build logs a `page_client-reference-manifest.js`
  copy warning. Pre-existing Next bug with route groups; build exits 0 and Netlify
  doesn't use standalone output.
