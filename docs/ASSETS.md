# Visual Assets

All game art lives in `public/assets/<category>/<name>.png` (transparent PNG).
`src/assets/sprites.json` (size + anchor per sprite) is generated, so don't edit it by hand.

## Pipeline
Source sheets sit in `raw-assets/`. `raw-assets/manifest.json` maps sheet + blob index → asset name.

Standalone transparent images (one asset per file) go in `raw-assets/singles/` and the `"singles"` block of the manifest (`"file": ["category/name", max_side_px]`).

```bash
# 1. find blobs on a new sheet (writes a numbered preview.jpg)
python3 tools/slice_sheet.py detect raw-assets/<sheet>.webp /tmp/out
# 2. add "index": "category/name" lines to raw-assets/manifest.json
# 3. export PNGs + regenerate sprites.json
python3 tools/slice_sheet.py export raw-assets/manifest.json
```

To replace one sprite, overwrite its PNG with the same name and run step 3. No code changes needed.

## In use (59 sprites)
| Category | Sprites |
|---|---|
| buildings | hq, dealer, repair, claims, risk, customers, marketing (billboard) · decor: ev-center, market-intel, capital-vault |
| vehicles | 11 cars (traffic) + tow-truck |
| characters | advisor (present / happy / warning, 820 px), advisor-small, ceo, manager, executive, mechanic, surveyor, call-agent |
| environments | trees ×4, planter, bench, lamp, bus-stop, carport, guard-gate, cafe-terrace, ev-chargers, flags ×2, fountain-plaza, garden-island, cone, tyres |
| events | flood, rival-promo, storm, landslide, flood-warning |
| icons | shield, clipboard, ev-charger |

## Status
**Round 2 buildings are in the game.** All 10 buildings were rendered with the locked camera and pass `tools/angle_check.py` at the house angle **24° ± 3°** (the city's roads use 24°, see `PROJECTION = 'house'` in `src/world/projection.ts`). They are stored as WebP (1100 px wide, ~200 KB each).

Brand: `public/assets/brand/logo.webp` (Insure Universe logo) and `cover.jpg` (title-screen background with characters; the logo is overlaid in code). Note: the cover has tiny unreadable sign lettering baked in (dealer fascia, banners); regenerate with "no text on signs" if it bothers anyone.

## Still needed (priority order)
| # | Asset | Why |
|---|---|---|
| 1 | Vehicles at the 24° camera (`vehicle-guide.png`) | Traffic cars are round-1 art at a different angle; noticeable when zoomed in |
| 2 | Street furniture at 24° (bus stop, bench, carport, planters, garden island) | Same reason; round-1 pieces are small, so lower priority |
| 3 | Market Intel with a different emblem | Uses the same globe as Claims Service; players may confuse decor with a clickable place |
| 4 | Economy / regulation event art | Planned event types |

Rules for new art: no text or numbers baked in, transparent background, same light direction (top-left) and same isometric camera.

## Image-gen prompts — Round 2 (locked isometric camera)

### Why round 2
`python3 tools/angle_check.py` showed every round-1 building at a different camera angle: left plinth edge 23–28°, right edge 7–18°. Roads can only be parallel to one angle, so the art itself has to be regenerated at **one fixed camera: true 2:1 isometric, 26.57° on both sides**.

### The angle guide (attach to every prompt)
| File | Use for |
|---|---|
| `docs/angle-guide/building-guide.png` | buildings, plazas, street furniture, event vignettes |
| `docs/angle-guide/vehicle-guide.png` | cars and trucks (nose = yellow end, driving toward bottom-left) |

In the image tool, attach the guide as a **reference / structure / composition image** (ChatGPT: attach the image together with the prompt; Midjourney: `--cref` doesn't lock camera, use it as the image prompt with `--iw 1.5`; SD/Flux: ControlNet *depth* or *canny* on the guide).
Guide colours: **blue edge = main facade + entrance side**, **orange edge = short side**. The front corner points straight down.

### Style block (prepend to every prompt)
```
Use the attached image as an exact camera and composition reference: keep the identical true isometric 2:1 camera
(orthographic, no perspective, both ground edges of the plinth at 26.6° from horizontal, all vertical edges perfectly vertical),
the same plinth shape and size, and the front corner of the plinth pointing straight down at the viewer.
Replace the white block with the building described below; the main glass facade and entrance face the blue edge.

3D isometric miniature diorama game asset, semi-realistic stylized render, glossy white and royal-blue modern architecture,
soft cinematic studio lighting from the top-left, soft ambient occlusion, warm interior lights, small lush green shrubs and trees,
light-grey rounded plinth base, high detail, crisp edges, premium strategy game art,
isolated single object, centered, transparent background, no ground shadow outside the plinth,
no text, no letters, no numbers, no logos, no watermark
```

### Buildings (1600×1100, building fills ~85% of the frame) — regenerate all
| # | File name | Subject (put after the style block) |
|---|---|---|
| 1 | `hq` | 4-storey curved-glass insurance headquarters, terraced roof gardens with small trees, grand entrance canopy on the blue side, a small round fountain with a blue shield emblem in front of the entrance **inside the plinth** |
| 2 | `dealer` | car showroom with full-height glass walls, three new cars on display inside, two cars parked on the forecourt, two blue blank flags |
| 3 | `repair` | open-front auto repair workshop, three service bays with blue car lifts (one car raised), mechanics in blue overalls, tool cabinets, tyre stack |
| 4 | `claims` | open-plan claims service office shown as a cutaway, rows of desks with glowing monitors, staff with headsets, a globe emblem above the entrance |
| 5 | `customers` | customer service lounge with counters and sofas, outdoor café terrace with white umbrellas and seated customers on the plinth |
| 6 | `risk` | risk and reinsurance data centre, large satellite dish on the roof, server racks and a big blank world-map screen visible inside |
| 7 | `marketing` | two-storey creative agency, curved white facade with blue fins, rooftop LED billboard with an abstract blue gradient and white car silhouette (blank, no text), megaphone sculpture by the entrance, meeting room and video-editing desks visible through the glass |
| 8 | `ev-center` | EV service centre with charging bays, a white EV on a lift, blue lightning-bolt sign shape (no text), solar panels on the roof |
| 9 | `market-intel` | small classical-modern office with a large blue globe emblem above the door |
| 10 | `capital-vault` | compact white bank-vault building with a giant round steel vault door on the side and a shield emblem |

**Tip:** do #1 HQ first. When it passes the check below, attach **both** the guide and the HQ result to every later prompt ("match the camera, lighting and material of the second image").

### Street furniture with a direction (800×800) — regenerate
`bus-stop`, `carport`, `guard-gate`, `bench`, `cafe-terrace`, `fountain-plaza`, `ev-chargers`, `flag-pair`, `flag-planter`, `planter`, `garden-island`
Subject line example: `a covered bus stop with a blue curved glass roof and a wooden bench, on a small square plinth`

Round items (trees, lamps, cones, tyres) and characters **do not** need regenerating.

### Vehicles (800×500) — regenerate
Attach `vehicle-guide.png`. Subject line:
```
a {white sedan | silver SUV | blue SUV | red EV hatchback | sky-blue compact EV | dark-grey luxury SUV | red sedan | green EV crossover | lilac sedan | silver pickup | white minivan | white flatbed tow truck carrying a sedan},
nose toward the bottom-left exactly like the yellow end of the reference block, no plinth, no ground shadow
```

### Event vignettes (1024×1024, square plinth) — regenerate
`flood`, `storm`, `landslide`, `rival-promo` (+ new `economy`, `regulation`). Use the subjects from round 1 with the new style block.

### Quality gate (before the art goes into the game)
```bash
python3 tools/angle_check.py path/to/new-sprite.png
```
Both angles must be **24° ± 3°** (PASS) — the house camera. Re-roll anything that FAILs; don't try to fix angles in an editor.

When every building passes, set `PROJECTION = 'iso'` in `src/world/projection.ts`, re-slice / import, and re-check `layout.ts` spacing.
