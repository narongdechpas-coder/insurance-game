# Prompts — generic filler office buildings (3 types)

**Purpose:** fill the island edges and empty block corners so the city feels dense, like the reference image. These are background buildings, **not** business units. They must stay quieter than the 7 clickable buildings: lower, plain white, only thin pale-blue accents, no emblem, no royal-blue bands or fins.

**How to use:** open a new image chat for each building. Attach **2 references**: `docs/angle-guide/building-guide.png` and `raw-assets/round2/hq.webp` (to lock the camera, lighting and materials). Paste the whole block. Send the result to Claude for the 24° angle check.

---

## 1. Low-rise office (3 floors) → `office-low`
```
Match the camera of the SECOND reference image exactly: orthographic isometric view, no perspective,
ground edges at 24° from horizontal on both sides, all vertical edges perfectly vertical, front corner pointing straight down.
Match its lighting (soft studio light from the top-left), materials and overall render style.

Building: a plain three-storey white office block with a flat roof, regular grid of square windows with pale-blue tinted glass
and a few warm-lit interiors, thin light-grey window frames, two small rooftop AC units, a simple glass entrance door at ground level,
a narrow strip of low green hedge along the base, small light-grey rounded plinth just larger than the building.
Background building for a city diorama: calm and understated, white and light grey only with very subtle pale-blue glass,
NO royal-blue bands, NO emblems, NO signage, NO logos, NO text, NO people outside.

3D miniature diorama game asset, semi-realistic stylized render, crisp clean edges,
single isolated object, centred, fully transparent background, no ground shadow outside the plinth, no watermark.
Output: 1024×1024, building fills about 75% of the frame width.
```

## 2. Mid-rise tower (6 floors, slimmer) → `office-tower`
```
Match the camera of the SECOND reference image exactly: orthographic isometric view, no perspective,
ground edges at 24° from horizontal on both sides, all vertical edges perfectly vertical, front corner pointing straight down.
Match its lighting (soft studio light from the top-left), materials and overall render style.

Building: a slim six-storey white residential-office tower on a square footprint, horizontal white floor slabs with
recessed pale-blue glass between them, small balconies on two corners, a rooftop garden with two small round trees and a railing,
warm light in a few windows, small light-grey rounded plinth with low hedges at two corners.
Background building for a city diorama: calm and understated, white and light grey only with very subtle pale-blue glass,
NO royal-blue bands, NO emblems, NO signage, NO logos, NO text.

3D miniature diorama game asset, semi-realistic stylized render, crisp clean edges,
single isolated object, centred, fully transparent background, no ground shadow outside the plinth, no watermark.
Output: 1024×1024, building fills about 60% of the frame width (it is tall, leave headroom).
```

## 3. Shop-house row (2 floors, wide) → `office-row`
```
Match the camera of the SECOND reference image exactly: orthographic isometric view, no perspective,
ground edges at 24° from horizontal on both sides, all vertical edges perfectly vertical, front corner pointing straight down.
Match its lighting (soft studio light from the top-left), materials and overall render style.

Building: a modern two-storey row of three connected white shop-house units along the long facade, ground floor with
glass shopfronts and warm interior light (blank, no signs), upper floor with simple square windows, slim light-grey roof parapet,
small potted plants at the doors, light-grey rounded rectangular plinth.
Background building for a city diorama: calm and understated, white and light grey only with very subtle pale-blue glass,
NO royal-blue bands, NO emblems, NO signage, NO logos, NO text, NO people.

3D miniature diorama game asset, semi-realistic stylized render, crisp clean edges,
single isolated object, centred, fully transparent background, no ground shadow outside the plinth, no watermark.
Output: 1536×1024, building fills about 85% of the frame width.
```

---

**Checks before they go into the game (Claude does these):**
- Angle check `tools/angle_check.py`: 24° ± 3°
- Real transparency, with no baked-in checkerboard
- In the game they will be placed at ~0.4× scale along the island rim and behind the business units, so the 7 clickable buildings stay the visual heroes
