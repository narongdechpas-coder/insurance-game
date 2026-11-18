# Simulation engine (Phase 4, step 1)

`simulateQuarter(state, plan, responses)` in `src/game/sim/engine.ts`. It is pure and deterministic (seeded RNG), with no React. Parameters are in `src/game/sim/params.ts`. **All values are game-design estimates (ประมาณการเพื่อเกม), not Thai market statistics.**

## One quarter, in order
1. **Decisions → effect queue.** Every chosen card/tactic and event response adds its impact axes (growth / profit / risk / cx) to a queue, spread by **speed** (fast = now, normal = split, slow = next quarter) and **duration** (short 1q, normal 2q, long 4q).
2. **Competitor moves.** Rule-based by personality (aggressive / premium / digital / conservative). Each has discipline: it raises prices after losses.
3. **Mechanical levers.**
   - **Price:** customer price and rate adequacy. A price change is *earned* over 3 quarters (30/40/30), so a cut lifts volume now and the loss ratio later.
   - **Reinsurance:** Quota share 10/20/35% and Cat XL retention 150/300/500.
   - **Cat exposure:** a stock between 0.6 and 1.6.
4. **Market and shares.** Attractiveness = price + satisfaction + growth effects + rival moves. Share moves 28% toward its target each quarter (renewal inertia).
5. **Operations (consequences).** Demand vs capacity for the contact centre, claims and repair network. New customers call 1.6× more. A flood adds a claims surge. Overload costs satisfaction (and loss ratio for claims/repair), and raises a **consequence event** for next quarter.
6. **Money.** Loss ratio = base × claims trend (+0.5%/quarter) ÷ earned rate (benefit capped at 110%) − profit effects + overload leakage + **adverse selection** (price more than 4% above the market average → good risks leave first, +0.55 LR points per point of gap) + noise + flood. Expenses = admin + commission + spend above the routine level. Then Quota share, Cat XL, investment income, and capital.
7. **Satisfaction.** Gains get harder near 5★ and losses harder near 1★; satisfaction reverts toward 3.8★.
8. **Next events.** Consequences first (max 2, with cooldowns), then outside events. Floods are more likely in Q3–Q4 (game assumption).
9. **Report.** KPIs, ranked "why" drivers, competitor moves, consequences, rank. The game ends after the last quarter, or on bankruptcy (capital < 50% of start, a game rule).

## Consequence chains (examples)
| Decision | First effect | Consequence | Next quarter |
|---|---|---|---|
| Deep price cut | share ↑ | call centre overloaded → satisfaction ↓, renewals ↓ | "สายด่วนแน่น" event |
| Flood hits without preparation | claims surge | claims backlog → satisfaction ↓, leakage ↑ | "เคลมค้างสะสม" |
| Price cut + broad underwriting | volume ↑ | high-risk customers flood in | "ลูกค้าเสี่ยงสูงทะลัก" |
| Cheaper repairs / non-OEM parts | cost ↓ | complaints ↑ | "ข้อร้องเรียนพุ่ง" |
| Satisfaction ≥ 4.3★ for 2 quarters | — | customers recommend us | "ลูกค้าบอกต่อ" (opportunity) |

## Difficulty
| | Easy | Normal | Hard |
|---|---|---|---|
| Rival aggression | 0.5 | 1.0 | 1.6 |
| Flood hit chance (when warned) | 30% | 50% | 70% |
| Flood severity | 0.85× | 1× | 1.2× |
| Rivals' service improvement per quarter | 0 | +0.02★ | +0.05★ |
| Market noise | low | mid | high |

Consequence events fire when load exceeds 112% of capacity. Repair and claims start with a little more headroom than the call centre.

## Score at game end
Capital growth 30 + market share 25 + average CR 25 + satisfaction 20. A company below the bankruptcy line cannot outrank a solvent one.

## Balance
Run `REPORT=1 npx vitest run src/game/sim` → `docs/balance-report.md` (4 scripted strategies × 3 difficulties × 40 seeds).

## For insurance-expert review
- Loss-ratio response to price: elasticity 2.6 and the 3-quarter earning pattern.
- Reinsurance is simplified to a per-quarter treaty: QS with 30% ceding commission, Cat XL limit 2,000.
- Flood gross loss ≈ 22% of quarterly GWP at normal exposure; hit chance 35/50/65% by difficulty.
- Capacity/overload penalties, and whether call-centre load really scales with new business like this.
- The bankruptcy rule is a game simplification, not a regulatory capital test.
