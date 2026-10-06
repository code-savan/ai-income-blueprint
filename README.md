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
- `scripts/build.py`: hub, workbench, diagnostic, playbooks, prompts, tools and sources.
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
