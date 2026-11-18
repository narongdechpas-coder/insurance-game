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

## Still needed (priority order)
Done in round 1: AI Advisor high-res (3 poses), competitor event art, Marketing building with billboard.

| # | Asset | Why | Spec |
|---|---|---|---|
| 1 | **Buildings re-rendered at one camera angle, 2× size** | HQ and the new Marketing building use different angles from the others; sprites are 450–550 px wide and soften when zoomed in | All buildings same camera, ≥ 1000 px wide each |
| 2 | Economy / regulation event art | Planned event types | 1:1 iso vignette, ~600 px |
| 3 | Far skyline + Thai temple strip (optional) | The reference has a city horizon behind the river | Wide transparent strip, low detail, hazy |

Rules for new art: no text or numbers baked in, transparent background, same light direction (top-left) and same isometric camera.

## Image-gen prompts (for the "Still needed" list)

Paste the **Style block** in front of every prompt, so new art matches the sheets already in use.
After generating: remove the background (if the tool can't output transparency) → add to `raw-assets/` → run the pipeline above.

### Style block (always prepend)
```
3D isometric miniature diorama game asset, semi-realistic stylized render, glossy white and royal-blue modern architecture,
soft cinematic studio lighting from top-left, soft ambient occlusion, warm interior lights, small lush green shrubs and trees,
clean light-grey plinth base with rounded edges, high detail, crisp edges, premium mobile strategy game art style,
isometric camera ~30° elevation viewing the front-right corner, isolated single object, centered,
transparent background, no shadow outside the plinth, no text, no letters, no numbers, no logos, no watermark
```

### 1. AI Advisor — high-res portrait (3 poses)
```
[Style block — replace "isometric miniature diorama" with "3D stylized character render"]
Full-body cute 3D cartoon character, young Thai woman business advisor, mid-20s, friendly smile, big expressive brown eyes,
shoulder-length wavy dark-brown hair, navy blue blazer and pencil skirt with white blouse, small blue shield pin on lapel,
holding a tablet in her left hand, pose: {A: open right palm gesturing to the side as if presenting | B: index finger raised, slightly concerned expression, warning | C: both hands clasped, happy and celebrating},
front three-quarter view, standing, full body visible, 1024×1536, transparent background, no text
```
Generate A, B and C with the same seed or reference image so her face and outfit stay identical.

### 2. Competitor event — rival promotion
```
[Style block]
A small rival car-insurance showroom pavilion in red and orange accents (contrasting our blue brand),
large blank promotional banners and balloons, sale-day mood, a few miniature customers queueing at the counter,
two shiny cars on display with blank price boards, confetti on the floor, square plinth vignette, 1024×1024
```

### 3. Marketing & Brand building with billboard
```
[Style block]
Two-storey modern creative-agency office, white curved facade with royal-blue trim, open cutaway glass front showing
miniature staff at a mood board and video-editing desks, a large rooftop LED billboard showing an abstract blue gradient
with a white car silhouette (blank, no text), a small megaphone sculpture by the entrance, landscaped plinth, 1600×1100
```

### 4. Re-render the 7 core buildings at one camera angle (≥1000 px)
Use the same style block and camera line for every building. Change only the subject:
```
[Style block] + "rendered at 1600×1100, building fills 85% of the frame"
- HQ:        4-storey curved glass headquarters with terraced roof gardens, grand entrance canopy, shield-emblem fountain plaza in front
- Dealer:    car showroom with full-height glass walls, 3 new cars inside, forecourt parking with 2 cars, two blue brand flags (blank)
- Repair:    open-front auto repair workshop, 3 bays with blue car lifts, mechanics in blue overalls, tool cabinets, tyre stacks
- Claims:    open-plan claims service office in cutaway, rows of desks with monitors, staff on headsets, a globe emblem above the door
- Customers: customer service lounge with counters and sofas, outdoor café terrace with white umbrellas and seated customers
- Risk:      data and risk control building, satellite dish on the roof, server racks and a large world-map screen inside (blank)
- Marketing: see prompt 3
```
Tip: generate HQ first, then pass it as the reference image for the others, so the camera and lighting stay locked.

### 5. Economy / regulation event vignettes
```
[Style block]
Economy:    square plinth vignette, a miniature city block with a large stylised downward-trending 3D arrow sculpture (no numbers), worried miniature people, grey overcast sky tint, 1024×1024
Regulation: square plinth vignette, a classical white government building with columns, a giant clipboard and stamp sculpture beside it (blank paper), miniature officials, 1024×1024
```

### 6. Far skyline strip (optional)
```
Hazy distant Bangkok-style skyline panorama for a game background: modern towers in soft blue-grey,
a Thai temple with golden spires and orange tiered roofs in the centre, an arched white bridge over the river at right,
atmospheric perspective, low detail, pale sky fading to transparent at the top, no text, 3000×600, transparent background
```
