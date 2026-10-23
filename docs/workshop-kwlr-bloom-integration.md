# KWLR + Bloom workshop integration — 23 October 2026

## User-provided sources
- فكرة مهمة النشاطKWLR.docx: K two minutes, W two minutes, L three minutes; trainer-mediated progression; fourth column for unanswered questions.
- المدرسة الانطباعية.pdf: reference reading material (full article not embedded in the page; current page only offers a summary).
- فكرة برمجة تخطيط الوحدة .docx: Bloom modified 6-level table; helper (1) verbs and helper (2) product types W/O/V/T/K; objective written manually, teacher second-person vs student first-person.
- Original 38-slide PDF remains the canonical content and design reference.

## Added screens
- `/admin/workshops/[id]/kwlr`: trainer stage controller, counts, aggregated response text without participant names.
- `/w/[code]/kwlr`: participant entry using the existing session-specific stored participant token.
- `/admin/training/bloom-planner`: six-level editable blue planning table, category-filtered products, local draft, print, JSON export.
- Presenter links are limited to KWLR pages 16–18 and Bloom planning pages 25–37.

## Deployment sequence (NOT YET PERFORMED)
1. Apply `supabase/migrations/20261023_workshop_kwlr.sql` to the correct Supabase project after backup and review.
2. Deploy `supabase/functions/workshop-public/index.ts` without changing Asloobi scoring.
3. Deploy Next.js changes to staging on Hostinger; do not deploy production until all gates pass.
4. Verify trainer-only control, cross-session isolation, stage timing and reopening prevention, two real participant devices, refresh, completed results, responsive projector visuals.
5. Run `npm run build`, `npm run typecheck`, `node tests/workshop-kwlr-planner.cjs`, and `npm run test:workshop`.
6. Compare the original 38 slide images and content page-by-page; current native diagrams are approximations.
7. Approve PR only after findings are closed.

## Known limitations / correctness
- The latest prototype currently **does not automatically classify correct versus incorrect K responses**. Such a claim would be speculative.
- W questions can only be marked addressed when the participant explicitly links an L response to their own W question; unmatched does not mean factually unanswered.
- There is no participant-level learning research dashboard, no automatic homework assignment, and no AI grading.
- Planner drafts persist **only locally in that browser**, not Supabase; editing table-level cells and exporting JSON are present but synchronous workshop sharing is not.
- No conversion of the full 38-slide PDF into static images. Full direct-manipulation visual editor has not been built.
- Static regression tests are not equivalent to browser, security, CI, or production acceptance.
