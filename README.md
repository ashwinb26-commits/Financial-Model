# DCF Valuation Lab

An interactive discounted cash flow valuation study with a protected research
studio that publishes dated snapshots straight to GitHub.

The public dashboard is static and open to anybody. The studio sits behind
GitHub sign-in, edits the financial data and the valuation assumptions, and
commits the result to the repository, which triggers a redeploy. The point of
the whole arrangement is that updating the research every 6 months never means
editing source code.

> **The data shipped with this repository is illustrative.** Every figure in
> `public/data/valuations.json` is an invented placeholder chosen so the
> statements reconcile with each other. None of it is Asian Paints reported
> data, the snapshot is tagged `illustrative`, and the dashboard shows a banner
> saying so. Replace it with extracted and verified figures before presenting
> any company-specific conclusion as research.

## What is in the box

- A public research dashboard: reported history, a 5 year forecast, free cash
  flow build-up, cost of capital, discounting and terminal value, a value
  bridge, a sensitivity grid, 3 scenarios, the formulas written out, and a
  source trail for every figure.
- A release selector, so earlier published valuations can be read and compared
  against the current one.
- GitHub sign-in with a server-side allowlist, signed sessions, state
  validation and cross-site request forgery protection.
- A studio with a spreadsheet-style editor for 5 years of statements, a
  provenance record per figure, assumption controls that recalculate the model
  as they move, a preview that diffs against what is live, and a publish step
  that commits to GitHub.
- 211 tests covering the formulas, the validator, access control and the
  publication pipeline.

## How a valuation gets published

```
studio  ->  POST /api/publish
              session cookie verified, login checked against the allowlist,
              CSRF token checked, origin checked
            payload re-validated on the server
            model recalculated on the server, submitted results discarded
            current data file read from GitHub with its blob SHA
            new snapshot appended, every earlier snapshot kept
            file committed through the Contents API with that SHA
         ->  Cloudflare Pages sees the commit and redeploys
         ->  public dashboard serves the new snapshot
```

Three properties of that flow are worth stating plainly, because they are what
make it trustworthy rather than merely functional:

1. **The server does not trust the browser.** It re-validates the payload with
   the same rules the studio ran, then recalculates every output from the
   submitted inputs. Whatever results the browser sent are thrown away.
2. **Nothing published is ever edited.** Publishing appends a new dated
   snapshot and moves a pointer. A valuation from 6 months ago stays exactly
   as it was, which is what makes forecast against outcome comparison possible.
3. **The write is as narrow as it can be.** The Contents API can only touch the
   single path it is given, the configured path has to sit inside
   `public/data/` and end in `.json`, and the write carries the blob SHA the
   server itself just read, so a stale update is refused rather than applied.

## Running it locally

Requires Node.js 22 or a compatible release.

```bash
npm install
npm run dev          # the dashboard and studio, without the API
```

`npm run dev` serves the front end only. Sign-in and publishing need the
Cloudflare Functions runtime, which means secrets and Wrangler:

```bash
cp .dev.vars.example .dev.vars    # then fill it in, see docs/setup-guide.md
npm run preview:functions         # builds, then serves on http://localhost:8788
```

Other scripts:

| Script | What it does |
| --- | --- |
| `npm run build` | Typechecks every project, then builds to `dist/` |
| `npm run typecheck` | Typechecks the app, the Functions, the scripts and the tests |
| `npm run test` | Runs the test suite in watch mode |
| `npm run test:run` | Runs the test suite once |
| `npm run test:coverage` | Runs the tests with a coverage report |
| `npm run seed` | Regenerates the illustrative data file |
| `npm run verify` | Typecheck, test and build, which is what CI runs |

## The files, and what each one is for

### Shared, used by the browser and the server

These are the files both runtimes import. Keeping them shared is what stops the
dashboard and the publish endpoint from disagreeing about what a number means.

| File | Purpose |
| --- | --- |
| `shared/types.ts` | Every type in the data contract. The snapshot, the assumptions, the equity bridge, the API responses. Dependency free. |
| `shared/dcf.ts` | The calculation engine. Free cash flow to the firm, the cost of capital build-up, discounting, terminal value, the equity bridge and the sensitivity grid. Throws typed errors rather than returning a plausible wrong number. |
| `shared/validation.ts` | Validates a snapshot. Blocking errors and non-blocking warnings, including cross-statement reconciliation. The studio runs it for feedback, the server runs it as a gate. |
| `shared/snapshot.ts` | Snapshot identifiers, append-only merging, the diff the studio previews, and the headline value movement. |

### Cloudflare Pages Functions, the server

| File | Purpose |
| --- | --- |
| `functions/_middleware.ts` | Security headers on every response, including static assets. Content security policy, frame denial, permissions policy, strict transport security. |
| `functions/_lib/env.ts` | Reads and checks configuration. Also enforces that the data path cannot point outside `public/data/`. |
| `functions/_lib/crypto.ts` | HMAC signing, constant-time comparison, base64 that survives non-ASCII text, and RS256 signing for a GitHub App token. All on WebCrypto. |
| `functions/_lib/session.ts` | Signed session and OAuth state cookies, CSRF checking, and the same-origin destination guard for the post sign-in redirect. |
| `functions/_lib/guard.ts` | The gate every write goes through: same origin, valid session, login still on the allowlist, matching CSRF token. |
| `functions/_lib/github.ts` | Reading and writing the one data file, the OAuth code exchange, and the profile lookup. Handles files over 1 MB and maps a rejected stale SHA to an instruction. |
| `functions/_lib/publish.ts` | The publication decision logic, with GitHub injected so it can be driven by tests. |
| `functions/_lib/responses.ts` | JSON responses, blameless error bodies, and the same-origin check. Errors carry a code and a sentence, never a secret or an upstream body. |
| `functions/api/auth/login.ts` | Starts GitHub OAuth. Sets a signed, short-lived state cookie, then redirects. Requests no scopes. |
| `functions/api/auth/callback.ts` | Finishes OAuth. Checks state before spending the code, checks the allowlist before issuing any session. |
| `functions/api/auth/session.ts` | Who is signed in, plus the CSRF token for this session. Re-checks the allowlist on every call. |
| `functions/api/auth/logout.ts` | Ends the session. POST only, with CSRF and origin checks. |
| `functions/api/data.ts` | The live repository copy of the data file and its blob SHA, for the studio. Administrators only. |
| `functions/api/publish.ts` | The publish endpoint. Guard, size-capped body read, then the publication logic. |

### Front end

| File | Purpose |
| --- | --- |
| `src/main.tsx` | Mounts the app. |
| `src/App.tsx` | Routing, the session fetch, the top chrome and the footer. |
| `src/styles.css` | The whole design system. Tokens, base styles, components and 3 breakpoints. Readable rather than minified, because it is meant to be maintained. |
| `src/lib/router.tsx` | A history router in about 60 lines. Four routes do not need a routing library. |
| `src/lib/api.ts` | The API client, with a typed error that carries a code, validation issues and a support reference. |
| `src/lib/model.ts` | Hooks that run the engine in the browser. The dashboard recalculates from stored inputs and never reads the stored results. |
| `src/lib/hooks.ts` | Loader debouncing, focus trapping, dismissable popovers, and draft persistence. |
| `src/lib/format.ts` | Display formatting, re-exporting the engine's formatters so both views render identical figures. |
| `src/lib/download.ts` | Snapshot JSON and forecast CSV exports. |
| `src/lib/lineItems.ts` | The order statements are read in, shared by the public tables and the editor. |
| `src/components/ui.tsx` | Interface primitives. Labels, blur-first validation, tooltips, dialogs, skeletons, tables. |
| `src/components/charts.tsx` | Four charts as plain SVG, sized from a measured container so axis labels stay readable at phone width. |
| `src/components/icons.tsx` | The project's 8 icon marks. |
| `src/views/PublicDashboard.tsx` | The public dashboard shell, release selector and headline. |
| `src/views/public/*.tsx` | The dashboard's sections: history, the model, and the analysis. |
| `src/views/LoginView.tsx` | Sign-in, and the sentence shown for each failure code. |
| `src/views/AdminStudio.tsx` | The studio shell, data loading, draft state and the pinned status bar. |
| `src/views/admin/*.tsx` | The 5 editor sections and the pure helpers they share. |

### Data, scripts and configuration

| File | Purpose |
| --- | --- |
| `public/data/valuations.json` | The source of truth. Current pointer plus every published snapshot. |
| `public/_redirects` | Single-page-app routing on Cloudflare Pages. Functions and real files still win. |
| `scripts/seed-valuations.ts` | Regenerates the illustrative data file, running the real engine and validator so the output cannot contradict itself. |
| `data/annual-report-extraction-template.csv` | A worksheet for extracting figures before entering them. |
| `.dev.vars.example` | Placeholder secrets for local development. Copy to `.dev.vars`, which is gitignored. |
| `wrangler.toml` | Build output directory and runtime compatibility date for `wrangler pages dev`. |
| `.ux-profile.md` | The design decisions, recorded so later work stays consistent. |
| `.github/workflows/ci.yml` | Typecheck, test and build. Does not deploy. |

### Tests

| File | What it covers |
| --- | --- |
| `tests/dcf.test.ts` | The formulas, including a case small enough to work out by hand, the cost of capital build-up, the equity bridge, and every condition that should raise rather than return a number. |
| `tests/validation.test.ts` | The validator, and the shipped data file, so a bad seed fails the build rather than the deployment. |
| `tests/access-control.test.ts` | Forged and expired sessions, allowlist removal, missing CSRF tokens, cross-site writes, replayed OAuth callbacks and open redirects. |
| `tests/publish.test.ts` | The publication pipeline: what it refuses, what it recomputes, what it keeps, and what it commits. |
| `tests/github.test.ts` | The GitHub client against a stubbed fetch, including files over 1 MB and rejected stale SHAs. |

## Where to go next

| Document | For |
| --- | --- |
| [docs/setup-guide.md](docs/setup-guide.md) | GitHub OAuth, Cloudflare Pages, secrets, repository permissions, local development and deployment |
| [docs/six-month-maintenance.md](docs/six-month-maintenance.md) | The research cycle, start to published |
| [docs/security.md](docs/security.md) | What is protected, what is not, and how to rotate credentials |
| [docs/data-schema.md](docs/data-schema.md) | The shape of `valuations.json`, field by field |
| [docs/model-methodology.md](docs/model-methodology.md) | The method, its limitations, and what to check before using real figures |

## Deliberate limitations

Worth knowing before relying on any of it:

- **Forecasting is driver based, not schedule based.** Depreciation and capital
  expenditure are percentages of revenue rather than an asset roll-forward, and
  working capital moves with incremental revenue. Good enough to be honest
  about, not good enough to be precise.
- **Tax is a single effective rate on positive operating profit.** Deferred tax,
  carried-forward losses and one-off tax items are not modelled.
- **There is no market data feed.** The risk-free rate, beta and the equity risk
  premium are entered by hand, and the date they were observed belongs in the
  research notes.
- **No dark mode.** A deliberate scope choice, recorded in `.ux-profile.md`.
- **One administrator, no audit log beyond git.** The commit history is the
  record of who published what and when, which is enough for a single-analyst
  project and would not be for a team.

Not investment advice. An independent learning project.
