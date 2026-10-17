# Changelog

## 1.0.0

Built the full site: a public dashboard, GitHub sign-in and a research studio
that publishes to GitHub.

### Engine

- Kept the starter's free cash flow logic and extended it
- Added a cost of capital build-up from risk-free rate, beta, premiums, cost of
  debt and capital weights
- Added year by year driver overrides, alternative capital expenditure and
  working capital methods, and mid-year discounting
- Added an itemised enterprise to equity bridge that cannot deduct a lease
  twice
- Replaced silent failures with typed errors, including a refusal to value a
  perpetuity on negative final cash flow
- Forecast year labels now follow the history instead of being hardcoded

### Data

- New schema: a current pointer plus an append-only list of dated snapshots
- Full statement coverage with per-figure provenance: source, page, statement,
  unit, classification and verification
- Source documents as first-class records
- Bull, base and bear scenarios, and configurable sensitivity axes
- `npm run seed` regenerates the illustrative file through the real engine and
  validator

### Public dashboard

- 10 sections: release and status, history, forecast, cost of capital,
  discounting, the value bridge, sensitivity, scenarios, methodology, sources
- Release selector with comparison against an earlier release
- Scenario switching that recalculates every table in the browser
- Four charts drawn as plain SVG, sized from a measured container
- Snapshot JSON and forecast CSV export

### Studio

- GitHub OAuth sign-in with a server-side allowlist
- Spreadsheet-style editor for the statements, with derived rows and a copy
  down control for source details
- Assumption editor with live recalculation and a pinned output bar
- Equity bridge editor with explicit lease treatment
- Preview that diffs against what is published, then a separate publish step
  with a named confirmation
- Drafts persist in the browser across a refresh or a closed tab

### Server

- Cloudflare Pages Functions for sign-in, session, sign-out, live data and
  publish
- Signed HttpOnly sessions, OAuth state validation, CSRF tokens, origin checks
- Server-side revalidation and recalculation of everything submitted
- GitHub App installation token or fine-grained token, with SHA-based
  concurrency control
- Security headers on every response

### Design

- Rebuilt the stylesheet as a documented design system
- IBM Plex Sans and IBM Plex Mono, with every figure in tabular numerals
- Weights limited to 400, 500 and 600. No text below 12px.
- Proved at 375px and 1280px with no page-level horizontal overflow
- Reduced-motion paths throughout, visible focus rings, 44px hit targets

### Tests and documentation

- 211 tests across the engine, the validator, access control, the publication
  pipeline and the GitHub client
- Rewrote the README, and added setup, maintenance, security and schema guides
- Replaced the GitHub Pages deployment workflow with a check-only workflow,
  since Cloudflare Pages deploys from its own Git integration

## 0.1.0

Starter scaffold: a React, TypeScript and Vite app with a browser-side free
cash flow calculator, assumption controls, a history view, formula notes, a
sensitivity grid, an illustrative-data warning, a GitHub Pages workflow and the
research documentation.
