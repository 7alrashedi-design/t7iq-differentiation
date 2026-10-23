# Google Slides-controlled workshop synchronization (experimental; NOT deployed)

## Canonical source
Google Slides presentation ID `1pLBZx1olhefO_lGhEkecRSW3yQTXhoJgZ5achnxvLD0`. The `app/api/workshop-slide/route.ts` manifest contains the 38 original object IDs as read from the Google Slides API on 23 October 2026. Editing stays in Google Slides. Per-page PNG is only a temporary display rendering; it is not a substitute editable deck.

## Secure Google Slides API prerequisite
1. Provision a Google Cloud **service account** with Google Slides API enabled.
2. Grant its email **Viewer** permission on the canonical Google Slides presentation only.
3. Store its JSON credentials as the **server-only** environment secret `GOOGLE_SLIDES_SERVICE_ACCOUNT_JSON` in Hostinger runtime deployment. Never use `NEXT_PUBLIC_` and never commit JSON credentials.
4. Restart staging and confirm `GET /api/workshop-slide?page=1` returns image/png (not 503). Test pages 1, 2, 3, 11, 18, 26, 37 and 38; inspect pixels against the original PDF.
5. Verify that the full canonical 38-page manifest still matches current Google Slides order after any slide insertion/deletion/reordering.

## UI behavior
- When page-image API succeeds: page 1–38 is controlled by the same React state that owns the displayed Google-sourced page image, direct slide navigation and activity selection. Page 11 = Asloobi, pages 16–18 = KWLR, 25–37 = Bloom planning. Leaving Asloobi hides its overlay. Summary figures are fetched only through current session `workshop-public` code.
- If API isn't configured or fails: embedded Google Slides is shown with the player's native controls, with **no** local slide numbering or claim of automatic synchronization. Activity controls are manual.
- Display image updates from live Google Slides; cache 60s. Refresh may be needed to see updates.
- Interactive activities are app layers; they are not Google Slides-native elements.

## Release blockers
- New image renderer depends on credentials and document sharing not yet provisioned; **has not been exercised with authenticated Google Slides API**.
- No cross-device session E2E / browser visual / Hostinger staging test has passed yet.
- KWLR migrations and Edge Function must be deployed as distinct, authorized operations before feature activation.
- The embedded baseline remains the safe fallback. Do not merge or deploy PR without image endpoint validation and participant test.
- Standardized API `getThumbnail` is the authoritative Google rendering approach, but if any slide page is empty, requires redesign or explicit acceptance by workshop owner.
- Before merging also tighten trainer authorization for the KWLR control path through verified server-side admin ownership (profile role conventions must match schema).
