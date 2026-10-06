# Offer choices and universal-guide verification

Verified October 6, 2026. Product commit `4eae0cdb2b5eb3bb8624895157b9b04d19f7d6fd` deployed successfully to Cloudflare Pages and the live custom domain. GitHub build and deployment checks passed.

## Delivered behavior

- The sidebar remains. The sequence is Start here → Choose my offer → My next steps. The first-time quiz has six questions, shown one at a time.
- Ten services and ten product ideas have clear deliverables, practice-time estimates, tradeoffs, examples and source notes. A three-question interview suggests choices. Members can choose their own offer without filling a form.
- Selecting a different offer keeps existing work. Changing the service/product track requires a reset warning, consent and a completed quiz. Leaving the quiz keeps the existing route and work.
- Saving the reset result atomically clears that member’s selected offer, guide progress, tasks, custom tasks, notes, sheet settings and tracker rows. Account, access and sessions remain. Stale or unconfirmed reset requests fail.
- All ten playbooks have concrete steps, working prompts, free and optional paid paths, and examples for the relevant choices. The selected offer sets the initial example; readers can inspect other examples without changing their saved offer.
- Research instructions cover Instagram, Facebook Groups, LinkedIn, Maps/websites and permitted marketplace enquiries. Five channel prompts and a two-stage prompt help members prepare an agent task, then verify its sources. Manus and Z.ai are included with plan/feature limits.
- Service recipes cover all ten choices. The website example includes a complete HTML starter and a novice static publishing path. Commerce uses a real store platform; Vercel Hobby restrictions are explained.
- Product examples include distinct filled practice and blank worksheets, build steps and tests. Affiliate choices have eligibility, real-item inspection and commission tasks rather than download-building tasks.
- Task links open the exact relevant playbook chapter in a new tab. Chapter navigation stays in the reader. The 50 action prompts and 300 reference prompts remain available.
- Examples explain what they are, why they are here and what a buyer receives. Practice names and facts are labeled fictional. Sources distinguish existing formats and category evidence from unproven product demand.

## Live browser checks

Using the authorized existing test account:

1. Completed the offer interview, inspected suggested writing services, selected Landing-page copy, and verified the saved offer and next task on My next steps.
2. Opened a guide in a new tab while the task page remained available. Verified the saved offer selected the appropriate reader example and chapter navigation used the same tab.
3. Expanded Instagram research instructions and its separate prompt. The copy control reported Copied. The browser automation’s virtual clipboard did not expose that clipboard text, so cross-application paste was not verified.
4. Opened Change my track, checked the explicit warning and entered the quiz. Left without saving a new result; the saved service offer and existing work remained. No permanent live-account reset was performed.
5. Switched the product example to Job-application tracker. Verified its five making steps, source explanation, filled worksheet and blank worksheet. Downloaded the filled practice worksheet successfully.
6. Opened the complete freelancer workbook and inspected its purpose and temporary practice fields.
7. Verified the polished next-task text and exact `/playbooks/playbook-a-land-first-client.html#step-1` link with `target="_blank"`.
8. Verified the tools page includes Manus and Z.ai, their account limits and official links. Their visible brand images loaded. Below-fold images use lazy loading and were not all inspected individually.

Screenshot: `offer-verification-20261006.jpg` shows the current live sidebar, saved offer, change-track control and next task. Earlier screenshots document the previous revision, not this release.

## Automated checks

- `python scripts/build.py` passed.
- `python tests/content.py` passed: 33 HTML pages, unique IDs, valid local references, sidebar shell, progressive quiz/readers, ten services and ten products, recipe completeness, per-offer examples, reset controls, new-tab guide links, exactly 50 action and 300 reference prompts.
- `node --test tests/backend.test.mjs` passed all 11 tests with SQLite-backed D1 queries. Coverage includes authentication, CSRF, owner isolation, route and choice validation, task-template updates preserving work, metadata exclusion from completion counts, tracker handling, affiliate tasks, reset consent, stale resets, atomic reset rollback and fresh tasks after reset.
- `node --check js/workbench.js` and `git diff --check` passed.

## Limits

Desktop browser behavior was inspected. Responsive styles and drawer behavior are implemented; no physical-phone visual test was performed. No real purchase, refund, withdrawal or financial transaction was made. Product ideas need validation with actual buyers. Practice files are teaching starters, not complete products to resell unchanged. The external marketing site, Whop listing and the account’s payout eligibility were not changed or verified. The recording plan explains those remaining owner checks and payout timing.
