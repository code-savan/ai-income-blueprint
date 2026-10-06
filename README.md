# AI Income Blueprint

An authenticated, action-first static product on Cloudflare Pages. Buyers select a service or product track, see the next unfinished task, and follow ten connected playbooks with free and optional paid tool routes.

## Edit and build

The app has no npm build requirement. Python 3 builds the checked-in HTML from editable curriculum. Cloudflare Pages can continue serving the repository root with its existing D1, KV and auth configuration.

```sh
python scripts/samples.py
python scripts/build.py
node --test tests/backend.test.mjs
python tests/content.py
```

Node 24 is used for backend tests because the SQLite-backed D1 adapter uses `node:sqlite`. No third-party test dependency is needed.

- `curriculum/books.py`: ten playbooks, action prompts, expected outputs, checks, examples and next links.
- `curriculum/vault.json`: original 300 reference prompts.
- `curriculum/vault_review.py`: corrections and evidence/consent constraints for the reference vault.
- `scripts/build.py`: onboarding, next steps, progressive readers, libraries, trackers and sources.
- `scripts/layout.py`: shared sidebar, page furniture and route diagrams.
- `scripts/samples.py`: complete filled examples and editable sample assets.
- `js/workbench.js`: interactions and authenticated saving.
- `functions/api/track.js`: saved track selection using reserved progress keys; no database migration.
- `preview.html`: intentionally public excerpt for manual sample delivery. Full samples and prompt pages remain authenticated.
- `docs/recording-plan.md`: five filming scenes, seven-post sequence, and launch work plan.

For a local preview with a fictional account and ephemeral SQLite data:

```sh
node scripts/preview.mjs
```

Open `http://127.0.0.1:8765`. The preview binds to localhost only. It does not touch production data. Real payment/auth provisioning is validated separately in the deployed environment.

## Data compatibility

Track A remains products and Track B remains services. Existing task IDs, completion flags, notes, custom tasks, progress and sheet rows remain. Default task text updates and missing defaults are added. Guide refresh no longer deletes saved work. Selection metadata does not count as completed learning. Existing completed tasks should be reviewed against the revised guidance.

Existing Cloudflare environment bindings, secret names, payment provisioning, email delivery and login routes are unchanged. Do not commit credentials or `.env` files. Full content is rendered into authenticated HTML rather than a public JavaScript curriculum payload.

## Claim standards

Worked businesses and numeric scenarios are fictional and labeled. Do not add invented testimonials, revenue screenshots, student counts, conversion ratios or guaranteed time-to-sale claims. Prices and eligibility are dated and linked to official sources. The video calculator uses hypothetical inputs until the buyer enters their live plan figures. Never sell a universal output count from a variable credit plan.

Check `sources.html` against current official documentation before changing tool advice. The wider public marketing site and Whop listing are external to this repository; align their claims and inclusions with this version separately.

## Guided interface

The sidebar stays available on desktop and opens from Menu on mobile. Start here checks the saved account track: first-time members get one onboarding CTA; returning members continue their saved route. The quiz shows one of six questions at a time. My next steps shows the selected route and next unfinished task, with notes and the full checklist available on demand. Trackers have their own screen. Each playbook displays one chapter, supports direct step URLs and saves completion independently of navigation. Track changes live in profile settings.

The content-service example compares a coach, repair business and shop; the product example is a reusable freelancer workbook. Previous sample URLs remain as links to the updated examples for bookmark compatibility.

## Offer-based routes

`curriculum/choices.py` defines ten service and ten product choices, with individual recipes, checks and primary-source limits. `scripts/offers.py` builds the offer interview, practice files and explained examples. `scripts/guides.py` adapts shared chapters and adds platform-specific research instructions. Fifty action prompts and the 300-prompt reference vault remain available.

`/api/choice` saves one route-bound offer without clearing work. `/api/track` requires explicit reset confirmation to change an existing track. The reset atomically clears only that member’s progress, task notes/custom tasks and tracker rows/settings, then saves the new track. Account and access are retained. The quiz warns before starting and clears work only on saving its final result. The first affiliate task checks eligibility, rather than building a download.

Research notes: `docs/offer-research.md`. Recording directions: `docs/recording-plan.md`.
