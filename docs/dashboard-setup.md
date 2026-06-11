# Owner / management dashboard — Cloudflare setup

The dashboard at `/dashboard` lets building owners view documents and lets
AGM management staff upload and delete them. It runs on the existing
Cloudflare Pages deploy — no new hosting — using:

- **Cloudflare Access** for login (sign-in with email link or any SSO IdP).
- **Cloudflare Pages Functions** for the API endpoints (`/api/documents/*`).
- **Cloudflare R2** for document storage, one bucket shared across every
  property site, with each property's documents scoped under its own key
  prefix (`<site-slug>/<folder>/<filename>`).

The code is checked in. What's left is the per-account Cloudflare
configuration — Access policy, R2 bucket, bindings. This file walks
through it.

---

## 1. Create the R2 bucket

1. Cloudflare dashboard → **R2** → **Create bucket**.
2. Name it `agm-property-documents` (or update `wrangler.toml`).
3. Optionally create `agm-property-documents-preview` for preview deploys.

## 2. Bind R2 to the Pages project

1. Cloudflare dashboard → **Workers & Pages** → this Pages project →
   **Settings** → **Functions** → **R2 bucket bindings**.
2. Add a binding:
   - Variable name: `DOCUMENTS`
   - R2 bucket: `agm-property-documents`
3. Apply the same binding to both **Production** and **Preview** environments.

## 3. Set environment variables

In **Settings** → **Environment variables**, add:

| Variable | Value | Notes |
|----------|-------|-------|
| `SITE_SLUG` | `magnolia-crestview` | One per property — scopes documents within the shared bucket |
| `MANAGEMENT_EMAIL_DOMAIN` | `agmrealestategroup.com` | Anyone whose verified email ends `@<this>` is treated as management (read + upload + delete) |

## 4. Protect the dashboard with Cloudflare Access

The Functions trust the `Cf-Access-Authenticated-User-Email` header.
Cloudflare only injects this header for routes covered by an Access
policy — so it is **critical** to configure the policy below. Without
it the routes will reject every request (`401`).

1. Cloudflare dashboard → **Zero Trust** → **Access** → **Applications**
   → **Add an application** → **Self-hosted**.
2. **Application name**: `Magnolia Crestview Dashboard`.
3. **Application domain**: pick the production domain of the Pages
   project and add **two paths**:
   - `/dashboard`
   - `/api/documents/*`
4. **Identity providers**: pick the IdP(s) you want — Google Workspace,
   Microsoft, One-time PIN over email, etc.
5. **Policies** → add policies in this order:
   - **Allow — Management**
     - Action: Allow
     - Include: `Emails ending in @agmrealestategroup.com`
   - **Allow — Property owners**
     - Action: Allow
     - Include: `Emails` (paste in each owner's verified email, one per
       property), or use a group if you maintain one in Access.
6. Save the application. Access will now intercept `/dashboard` and the
   API routes, redirecting unauthenticated users through the IdP first.

## 5. Per-property scoping

In the shared R2 bucket every object key starts with the property's
`SITE_SLUG`. The Functions enforce this on both reads and writes — a
user signed in to one property's deployment can never reach another
property's keys, even by guessing.

When you spin up a new property site from this template:

1. New Cloudflare Pages project pointing at the new repo.
2. Same R2 binding (`DOCUMENTS`) → same shared bucket.
3. Set `SITE_SLUG` to the new property's slug.
4. Add the property's owner emails to the Access policy (or to a
   property-specific group).

That's it — code is unchanged across properties.

## 6. Folder structure

The dashboard ships with three folders, fixed in
`functions/api/documents/_shared.js`:

- `reports` → **Reports**
- `marketing-and-leasing` → **Marketing and Leasing**
- `marketing-comparatives` → **Marketing Comparatives**

To add or rename folders later, update the `FOLDERS` map there and the
`LABELS` map in `src/pages/dashboard.astro`. Existing R2 keys aren't
moved automatically — rename via the R2 dashboard or a one-off script.

## 7. Local development

Pages Functions don't run in `astro dev` — use Wrangler:

```bash
npx wrangler pages dev . --r2 DOCUMENTS=agm-property-documents
```

Cloudflare Access doesn't gate local dev. Inject a fake email header so
the middleware lets you through:

```bash
curl -H "Cf-Access-Authenticated-User-Email: you@agmrealestategroup.com" \
  http://localhost:8788/api/documents/whoami
```
