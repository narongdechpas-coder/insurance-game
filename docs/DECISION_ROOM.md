# Decision Room (Phase 3)

## Flow
Command Center → **① รับมือเหตุการณ์** → **② วางกลยุทธ์** → **③ ยืนยันแผน** → (Phase 4) simulation + Quarterly Review

Entry points: the gold "เข้าห้องตัดสินใจ" button and the **Strategy** nav tab open step ①; "วางกลยุทธ์ของหน่วยงานนี้" in a location panel opens that building's card in step ②. After confirming, the gold button becomes "ดูแผนที่ยืนยันแล้ว" (opens step ③).

- **① รับมือเหตุการณ์:** every headline event asks for one of 3 responses (`src/game/decisions/scenarios.ts`). No default; all must be answered before ③ unlocks. Answering moves to the next open event. Responses spend from the same quarter budget and move the impact preview.
- **② วางกลยุทธ์:** 8 strategy cards, stance → tactic.
- **③ ยืนยันแผน:** one-page summary of responses and cards with cost per line; each line links back to where it was decided. Confirm is blocked when over budget or an event is unanswered. Confirming stores `ui.planConfirmed`; any later change clears it.

## Code
| Layer | File | What |
|---|---|---|
| Data | `src/game/decisions/cards.ts` | 8 strategy cards, options, cost, impact direction, unlock quarter, budget |
| Events | `src/game/decisions/scenarios.ts` | event → question + 3 responses (cost, impact, speed, related cards) |
| Logic | `src/game/decisions/plan.ts` | `previewImpact`, `planCost`, `budgetLeft`, `unansweredEvents`, `changedCards`, `reviewPlan` (advisor rules incl. response × strategy) — all take the optional `responses` |
| Tests | `src/game/decisions/plan.test.ts` | `npm test` |
| State | `src/store/useGameStore.ts` | `plan`, `ui.screen`, `ui.step`, `ui.activeCard` |
| UI | `src/ui/decision/*` | header (steps + budget), card list, card stage, impact panel, advisor |

`QuarterPlan` + `Responses` are the contract with Phase 4: the simulation engine will read the same objects.

## Design rules
- Two layers: a **stance** (3–5 per card, what to do) and, for stances that need it, a **tactic** (2–3, how to do it). Choosing a stance pre-selects its recommended tactic, so a quick player can move on.
- Tactics must differ in real outcomes: cost (replaces the stance cost), an impact modifier, speed (how soon) and duration (how long). A unit test enforces that no two tactics in a stance are identical. Speed and duration are recorded for the Phase 4 engine.
- Status: tactics are live on all 8 cards (every stance except "keep as is").
- The only number shown is the budget (million THB). Impact is shown as direction (chevrons), never as forecasts.
- Q1 unlocks 4 cards (pricing, distribution, marketing, reinsurance); product mix + underwriting unlock in Q2, repair + cat exposure in Q3. `isUnlocked(card, q, unlockAll)` lets a mode open everything.
- Customer Experience and Claims have no card of their own; they move through repair, distribution and marketing choices.

## Mock values (game design, not market data)
- Quarter strategy budget: 150 million THB.
- Option costs: 20–70 million THB.
- Impact directions: −2…+2 per axis (growth, profit, risk, customer).

## For insurance-expert review
- Event responses: effect of pre-positioning surveyors before a flood, customer flood warnings, an EV battery cover launched before claims data exists, value-added service vs price matching.
0. Tactic effects (Marketing now; later reinsurance quota share vs Cat XL, non-OEM parts, non-renewal of high-risk customers, which needs a regulatory/fair-treatment check).
1. Impact direction of every option in `cards.ts`, especially the timing (a price cut lifts volume now and hurts the loss ratio later; the preview can't show that lag yet).
2. Reinsurance is simplified to 3 stances (keep / buy more / retain). It doesn't separate quota share from excess of loss.
3. Product groups: motor / property-fire / misc-PA. Should compulsory motor (พ.ร.บ.) be its own line?
4. Advisor warning rules in `reviewPlan` (e.g. price cut + broad underwriting, retaining risk during a flood warning).
