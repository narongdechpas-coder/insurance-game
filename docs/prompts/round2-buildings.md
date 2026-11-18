# Round 2 prompts — buildings (copy-ready)

**How to use:** open a new image chat for each building → attach `docs/angle-guide/building-guide.png` → paste the whole prompt block → generate.
Start with **HQ**. Once HQ passes the angle check, attach the HQ image as a second reference for all the other buildings and add this line at the end of the prompt:
`Match the camera, lighting, materials and colour palette of the second reference image exactly.`

Check every result: `python3 tools/angle_check.py <file>` → both angles must be 26.57° ± 3° (PASS). Re-roll anything that FAILs.
Save the file as `raw-assets/singles/<file name>.png` and tell Claude; the import step trims and sizes it.

## 1. Insurance HQ → `hq`

```
Use the attached reference image as an exact camera and composition guide. Keep the identical true isometric 2:1 camera: orthographic with no perspective, both ground edges of the plinth at 26.6° from horizontal, every vertical edge perfectly vertical, and the front corner of the plinth pointing straight down at the viewer. Keep the same plinth shape and proportions. Replace the white block with the building described below. The main glass facade and the entrance face the BLUE edge of the reference; the short side faces the ORANGE edge. Remove the grid lines and the coloured edge lines.

Building: A 4-storey insurance headquarters with flowing curved white floor slabs and continuous blue glass facades, terraced roof gardens with small trees and benches, tiny office workers visible inside warm-lit floors, a grand double-height entrance canopy, and in front of the entrance (still inside the plinth) a small round fountain with a glowing blue shield emblem.

Style: 3D isometric miniature diorama game asset, semi-realistic stylized render, glossy white and royal-blue modern architecture, soft cinematic studio lighting from the top-left, soft ambient occlusion, warm glowing interior lights, small lush green shrubs and trees on the plinth, light-grey rounded plinth base, high detail, crisp clean edges, premium strategy game art.

Output: landscape 3:2 at the highest resolution available (1536×1024 or larger), the building filling about 85% of the frame width, single isolated object, centred, fully transparent background, no shadow outside the plinth, no text, no letters, no numbers, no logos, no watermark.
```

## 2. Dealer Network → `dealer`

```
Use the attached reference image as an exact camera and composition guide. Keep the identical true isometric 2:1 camera: orthographic with no perspective, both ground edges of the plinth at 26.6° from horizontal, every vertical edge perfectly vertical, and the front corner of the plinth pointing straight down at the viewer. Keep the same plinth shape and proportions. Replace the white block with the building described below. The main glass facade and the entrance face the BLUE edge of the reference; the short side faces the ORANGE edge. Remove the grid lines and the coloured edge lines.

Building: A modern car showroom: single tall storey with full-height glass walls and a sweeping white roof with a royal-blue stripe, three new cars (white, red, silver) on display inside on a turntable, two cars parked on the forecourt with painted parking lines, two blank blue-and-white feather flags, a small sales team and customers inside.

Style: 3D isometric miniature diorama game asset, semi-realistic stylized render, glossy white and royal-blue modern architecture, soft cinematic studio lighting from the top-left, soft ambient occlusion, warm glowing interior lights, small lush green shrubs and trees on the plinth, light-grey rounded plinth base, high detail, crisp clean edges, premium strategy game art.

Output: landscape 3:2 at the highest resolution available (1536×1024 or larger), the building filling about 85% of the frame width, single isolated object, centred, fully transparent background, no shadow outside the plinth, no text, no letters, no numbers, no logos, no watermark.
```

## 3. Repair Network → `repair`

```
Use the attached reference image as an exact camera and composition guide. Keep the identical true isometric 2:1 camera: orthographic with no perspective, both ground edges of the plinth at 26.6° from horizontal, every vertical edge perfectly vertical, and the front corner of the plinth pointing straight down at the viewer. Keep the same plinth shape and proportions. Replace the white block with the building described below. The main glass facade and the entrance face the BLUE edge of the reference; the short side faces the ORANGE edge. Remove the grid lines and the coloured edge lines.

Building: An open-front auto repair workshop: three service bays with royal-blue two-post car lifts (one car raised high, one car on the floor with its hood open), mechanics in blue overalls, blue tool cabinets, a tyre stack, yellow bay floor markings, rooftop AC units, white and blue building shell shown as a cutaway.

Style: 3D isometric miniature diorama game asset, semi-realistic stylized render, glossy white and royal-blue modern architecture, soft cinematic studio lighting from the top-left, soft ambient occlusion, warm glowing interior lights, small lush green shrubs and trees on the plinth, light-grey rounded plinth base, high detail, crisp clean edges, premium strategy game art.

Output: landscape 3:2 at the highest resolution available (1536×1024 or larger), the building filling about 85% of the frame width, single isolated object, centred, fully transparent background, no shadow outside the plinth, no text, no letters, no numbers, no logos, no watermark.
```

## 4. Claims Service → `claims`

```
Use the attached reference image as an exact camera and composition guide. Keep the identical true isometric 2:1 camera: orthographic with no perspective, both ground edges of the plinth at 26.6° from horizontal, every vertical edge perfectly vertical, and the front corner of the plinth pointing straight down at the viewer. Keep the same plinth shape and proportions. Replace the white block with the building described below. The main glass facade and the entrance face the BLUE edge of the reference; the short side faces the ORANGE edge. Remove the grid lines and the coloured edge lines.

Building: An open-plan claims service office shown as a cutaway with the front-left wall removed: rows of white desks with glowing monitors, staff wearing headsets, a few customers at a service counter, potted plants, and a blue globe emblem mounted above the entrance (no text).

Style: 3D isometric miniature diorama game asset, semi-realistic stylized render, glossy white and royal-blue modern architecture, soft cinematic studio lighting from the top-left, soft ambient occlusion, warm glowing interior lights, small lush green shrubs and trees on the plinth, light-grey rounded plinth base, high detail, crisp clean edges, premium strategy game art.

Output: landscape 3:2 at the highest resolution available (1536×1024 or larger), the building filling about 85% of the frame width, single isolated object, centred, fully transparent background, no shadow outside the plinth, no text, no letters, no numbers, no logos, no watermark.
```

## 5. Customers → `customers`

```
Use the attached reference image as an exact camera and composition guide. Keep the identical true isometric 2:1 camera: orthographic with no perspective, both ground edges of the plinth at 26.6° from horizontal, every vertical edge perfectly vertical, and the front corner of the plinth pointing straight down at the viewer. Keep the same plinth shape and proportions. Replace the white block with the building described below. The main glass facade and the entrance face the BLUE edge of the reference; the short side faces the ORANGE edge. Remove the grid lines and the coloured edge lines.

Building: A bright customer service lounge: glass front, service counters with smiling staff, blue sofas and waiting chairs inside, plus an outdoor café terrace on the plinth with three white umbrellas, round tables and seated customers, flowering pink tree at one corner.

Style: 3D isometric miniature diorama game asset, semi-realistic stylized render, glossy white and royal-blue modern architecture, soft cinematic studio lighting from the top-left, soft ambient occlusion, warm glowing interior lights, small lush green shrubs and trees on the plinth, light-grey rounded plinth base, high detail, crisp clean edges, premium strategy game art.

Output: landscape 3:2 at the highest resolution available (1536×1024 or larger), the building filling about 85% of the frame width, single isolated object, centred, fully transparent background, no shadow outside the plinth, no text, no letters, no numbers, no logos, no watermark.
```

## 6. Risk & Reinsurance → `risk`

```
Use the attached reference image as an exact camera and composition guide. Keep the identical true isometric 2:1 camera: orthographic with no perspective, both ground edges of the plinth at 26.6° from horizontal, every vertical edge perfectly vertical, and the front corner of the plinth pointing straight down at the viewer. Keep the same plinth shape and proportions. Replace the white block with the building described below. The main glass facade and the entrance face the BLUE edge of the reference; the short side faces the ORANGE edge. Remove the grid lines and the coloured edge lines.

Building: A two-level risk and reinsurance data centre: large white satellite dish on the roof, glass ground floor showing analysts at desks, glowing server racks and a big blank blue world-map wall screen (no text), clean white walls with royal-blue bands.

Style: 3D isometric miniature diorama game asset, semi-realistic stylized render, glossy white and royal-blue modern architecture, soft cinematic studio lighting from the top-left, soft ambient occlusion, warm glowing interior lights, small lush green shrubs and trees on the plinth, light-grey rounded plinth base, high detail, crisp clean edges, premium strategy game art.

Output: landscape 3:2 at the highest resolution available (1536×1024 or larger), the building filling about 85% of the frame width, single isolated object, centred, fully transparent background, no shadow outside the plinth, no text, no letters, no numbers, no logos, no watermark.
```

## 7. Marketing & Brand → `marketing`

```
Use the attached reference image as an exact camera and composition guide. Keep the identical true isometric 2:1 camera: orthographic with no perspective, both ground edges of the plinth at 26.6° from horizontal, every vertical edge perfectly vertical, and the front corner of the plinth pointing straight down at the viewer. Keep the same plinth shape and proportions. Replace the white block with the building described below. The main glass facade and the entrance face the BLUE edge of the reference; the short side faces the ORANGE edge. Remove the grid lines and the coloured edge lines.

Building: A two-storey creative marketing agency: curved white facade with three tall royal-blue vertical fins, a rooftop LED billboard showing an abstract blue gradient with a simple white car silhouette (blank, no text), a large white-and-blue megaphone sculpture beside the entrance, upper floor meeting room with a colourful mood board, ground floor video-editing desks with monitors.

Style: 3D isometric miniature diorama game asset, semi-realistic stylized render, glossy white and royal-blue modern architecture, soft cinematic studio lighting from the top-left, soft ambient occlusion, warm glowing interior lights, small lush green shrubs and trees on the plinth, light-grey rounded plinth base, high detail, crisp clean edges, premium strategy game art.

Output: landscape 3:2 at the highest resolution available (1536×1024 or larger), the building filling about 85% of the frame width, single isolated object, centred, fully transparent background, no shadow outside the plinth, no text, no letters, no numbers, no logos, no watermark.
```

## 8. EV Service Center (decor) → `ev-center`

```
Use the attached reference image as an exact camera and composition guide. Keep the identical true isometric 2:1 camera: orthographic with no perspective, both ground edges of the plinth at 26.6° from horizontal, every vertical edge perfectly vertical, and the front corner of the plinth pointing straight down at the viewer. Keep the same plinth shape and proportions. Replace the white block with the building described below. The main glass facade and the entrance face the BLUE edge of the reference; the short side faces the ORANGE edge. Remove the grid lines and the coloured edge lines.

Building: An EV service and charging centre: wide arched royal-blue frame with a large lightning-bolt shape (no text), a white EV on a lift inside, technicians, three white EV chargers on the forecourt, solar panels on the roof.

Style: 3D isometric miniature diorama game asset, semi-realistic stylized render, glossy white and royal-blue modern architecture, soft cinematic studio lighting from the top-left, soft ambient occlusion, warm glowing interior lights, small lush green shrubs and trees on the plinth, light-grey rounded plinth base, high detail, crisp clean edges, premium strategy game art.

Output: landscape 3:2 at the highest resolution available (1536×1024 or larger), the building filling about 85% of the frame width, single isolated object, centred, fully transparent background, no shadow outside the plinth, no text, no letters, no numbers, no logos, no watermark.
```

## 9. Market Intelligence (decor) → `market-intel`

```
Use the attached reference image as an exact camera and composition guide. Keep the identical true isometric 2:1 camera: orthographic with no perspective, both ground edges of the plinth at 26.6° from horizontal, every vertical edge perfectly vertical, and the front corner of the plinth pointing straight down at the viewer. Keep the same plinth shape and proportions. Replace the white block with the building described below. The main glass facade and the entrance face the BLUE edge of the reference; the short side faces the ORANGE edge. Remove the grid lines and the coloured edge lines.

Building: A small classical-modern office with white columns, a large blue globe emblem above the glass entrance, warm-lit windows, neat hedges.

Style: 3D isometric miniature diorama game asset, semi-realistic stylized render, glossy white and royal-blue modern architecture, soft cinematic studio lighting from the top-left, soft ambient occlusion, warm glowing interior lights, small lush green shrubs and trees on the plinth, light-grey rounded plinth base, high detail, crisp clean edges, premium strategy game art.

Output: landscape 3:2 at the highest resolution available (1536×1024 or larger), the building filling about 85% of the frame width, single isolated object, centred, fully transparent background, no shadow outside the plinth, no text, no letters, no numbers, no logos, no watermark.
```

## 10. Capital Vault (decor) → `capital-vault`

```
Use the attached reference image as an exact camera and composition guide. Keep the identical true isometric 2:1 camera: orthographic with no perspective, both ground edges of the plinth at 26.6° from horizontal, every vertical edge perfectly vertical, and the front corner of the plinth pointing straight down at the viewer. Keep the same plinth shape and proportions. Replace the white block with the building described below. The main glass facade and the entrance face the BLUE edge of the reference; the short side faces the ORANGE edge. Remove the grid lines and the coloured edge lines.

Building: A compact white bank-vault building with a giant round polished steel vault door on the side wall, a blue shield emblem on the front, royal-blue roof band, small planters.

Style: 3D isometric miniature diorama game asset, semi-realistic stylized render, glossy white and royal-blue modern architecture, soft cinematic studio lighting from the top-left, soft ambient occlusion, warm glowing interior lights, small lush green shrubs and trees on the plinth, light-grey rounded plinth base, high detail, crisp clean edges, premium strategy game art.

Output: landscape 3:2 at the highest resolution available (1536×1024 or larger), the building filling about 85% of the frame width, single isolated object, centred, fully transparent background, no shadow outside the plinth, no text, no letters, no numbers, no logos, no watermark.
```
