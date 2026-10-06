# Sidebar and gradual-flow verification

Verified on 6 October 2026 against the live custom domain after Cloudflare Pages deployment. Product code: `ebfa8a75c2ca6c435d914d1fb2a1a9c914fae777`.

## Delivered interface

- A fixed purple desktop sidebar and a responsive Menu drawer, with profile/track settings at the bottom.
- Start here gives first-time members a dedicated Get my track teaser. Saved members see their existing route and continue to next steps.
- Six quiz questions appear one at a time, with Back, answer preservation, progress and explicit tie handling.
- My next steps shows the chosen track, the next unfinished task and a branching route diagram. The full task list/notes and related guides are deliberate disclosures. Trackers have a separate screen.
- Each of ten playbooks shows one chapter at a time, retains direct step anchors, and offers free and optional paid tool routes. Navigation does not mark work complete.
- Playbooks and prompts use editorial rows and expandable details instead of a wall of cards.
- Examples compare a fitness coach, repair business and shop. The product reference is a complete freelancer project workbook. Earlier example URLs lead to updated references for bookmark compatibility.
- A blank client brief CSV is linked at the intake step. The 50-prompt pack, 300-prompt vault, tool logos, calculator and operating sheets remain available.
- Asset versions prevent returning browsers from combining the new HTML with cached previous scripts and styles.

## Browser checks

Performed using the existing authorized test account, without changing login credentials, payment configuration or account access.

1. Loaded the new sidebar and saved-service landing, then opened the correct next task.
2. Entered the quiz from profile settings. Confirmed only one question is visible, Next requires an answer, and Back keeps the previous selection.
3. Completed the service quiz and verified the saved result and corresponding next steps.
4. Completed a tied quiz, chose the product branch, and verified its product-research first task. Restored the original service track.
5. Opened Playbook F, switched the spending route, advanced to a single intake chapter and copied its prompt.
6. Changed a playbook completion flag, reloaded the page, verified persistence, and restored the original flag.
7. Finished the current task directly from My next steps, verified the next task appeared, and restored the original completion state through the full list.
8. Switched the content reference between repair and shop contexts. Exactly one reference stayed visible; all three shop SVG layouts loaded.
9. Filtered the action pack to F and verified five prompts, expanded an entry, and downloaded all 50. Download contained 50 numbered entries and 19,439 bytes before the final intake-wording refinement.
10. Entered a hypothetical plan cost of 60 with 1,000 credits, 10 credits/attempt, three attempts/shot and two shots/edit. The UI calculated 60 credits/edit, 16 edits and 3.75 subscription cost/estimated edit.
11. Confirmed all nine tool logo images loaded.
12. Opened the reusable product reference and entered a practice brief value. The page clearly states that temporary worksheet fields require print/save before closing.
13. Opened the production public preview at `/preview`, including all three contexts and an independent first task.

Screenshots: `verification.jpg` shows the current task, branching diagram and sidebar. `quiz-verification.jpg` shows one-question onboarding with the sidebar.

## Automated checks

- `python scripts/build.py`: generates the shared shell, samples, ten readers, quiz, libraries, trackers and source page.
- `python tests/content.py`: 29 HTML pages; unique IDs, all local links/download references, ten complete playbooks, exactly 50 action and 300 reference prompts, sidebar presence, one visible quiz question, one visible reader chapter, and three distinct delivery examples.
- `node --test tests/backend.test.mjs`: seven tests passed using actual SQLite-backed D1 queries. Covers atomic track selection, invalid/unauthenticated choices, preservation of task IDs/notes/completion/custom rows, task ownership, sheet data, paid-content gating, CSRF, profile progress, diagnostic ties, calculator arithmetic and CSV escaping.
- Syntax checks for the workbench, shared header and profile JavaScript passed.

## Limits

Browser screenshots and interactions were checked at the available desktop viewport. Mobile breakpoints, drawer semantics, keyboard focus handling and reduced-motion rules are implemented; a physical-phone visual test was not performed in this environment. No real purchase, refund, withdrawal, email provisioning event or financial transaction was performed. Existing server auth and purchase-provisioning flows remain in place. The marketing site and Whop listing are external to this app repository. Revenue outcomes and higher price acceptance need actual buyer evidence.
