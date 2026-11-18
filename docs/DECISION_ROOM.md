# Decision Room (Phase 3)

## Flow
Command Center → **① Scenario** (not built yet) → **② Strategy** (live) → **③ Confirm** (not built yet) → Phase 4 simulation + Quarterly Review

Entry points: gold "เข้าห้องตัดสินใจ" button, the **Strategy** nav tab, and "วางกลยุทธ์ของหน่วยงานนี้" in a location panel (opens that building's card).

## Code
| Layer | File | What |
|---|---|---|
| Data | `src/game/decisions/cards.ts` | 8 strategy cards, options, cost, impact direction, unlock quarter, budget |
| Logic | `src/game/decisions/plan.ts` | `previewImpact`, `planCost`, `budgetLeft`, `changedCards`, `reviewPlan` (advisor warnings) |
| Tests | `src/game/decisions/plan.test.ts` | `npm test` |
| State | `src/store/useGameStore.ts` | `plan`, `ui.screen`, `ui.step`, `ui.activeCard` |
| UI | `src/ui/decision/*` | header (steps + budget), card list, card stage, impact panel, advisor |

`QuarterPlan` is the contract with Phase 4: the simulation engine will read the same object.

## Design rules
- Options are discrete stances (3–5 per card), not sliders.
- The only number shown is the budget (million THB). Impact is shown as direction (chevrons), never as forecasts.
- Q1 unlocks 4 cards (pricing, distribution, marketing, reinsurance); product mix + underwriting unlock in Q2, repair + cat exposure in Q3. `isUnlocked(card, q, unlockAll)` lets a mode open everything.
- Customer Experience and Claims have no card of their own; they move through repair, distribution and marketing choices.

## Mock values (game design, not market data)
- Quarter strategy budget: 150 million THB.
- Option costs: 20–70 million THB.
- Impact directions: −2…+2 per axis (growth, profit, risk, customer).

## For insurance-expert review
1. Impact direction of every option in `cards.ts`, especially the timing (a price cut lifts volume now and hurts the loss ratio later; the preview can't show that lag yet).
2. Reinsurance is simplified to 3 stances (keep / buy more / retain). It doesn't separate quota share from excess of loss.
3. Product groups: motor / property-fire / misc-PA. Should compulsory motor (พ.ร.บ.) be its own line?
4. Advisor warning rules in `reviewPlan` (e.g. price cut + broad underwriting, retaining risk during a flood warning).
