# Prompts — rival company art (for Insure Times + rivals tab)

**Use:** each rival gets its own headquarters picture in its brand colour. They appear in the newspaper's rival columns and can later go on the rivals tab and in the city. All 4 are fictional companies; keep them clearly different from any real insurer (no logos, no text, no real brand shapes).

**How to gen:** attach 2 references, `docs/angle-guide/building-guide.png` and `raw-assets/round2/hq.webp`, so the camera and lighting match the city. Paste one block per image. Send the results to Claude for the 24° check.

**Shared block (already included in every prompt below):**
```
Match the camera of the SECOND reference image exactly: orthographic isometric view, no perspective,
ground edges at 24° from horizontal on both sides, all vertical edges perfectly vertical, front corner pointing straight down.
Match its lighting (soft studio light from the top-left), materials and render style.
3D miniature diorama game asset, semi-realistic stylized render, high detail, crisp edges, light-grey rounded plinth,
single isolated object, centred, fully transparent background, no ground shadow outside the plinth,
no text, no letters, no numbers, no logos, no brand marks, no watermark.
Output: 1536×1024, building fills about 80% of the frame width.
```

---

## 1. Lotus Guard (aggressive pricing, coral-pink #e85d75) → `rivals/lotus-guard`
```
Match the camera of the SECOND reference image exactly: orthographic isometric view, no perspective,
ground edges at 24° from horizontal on both sides, all vertical edges perfectly vertical, front corner pointing straight down.
Match its lighting (soft studio light from the top-left), materials and render style.

Building: a busy two-storey insurance sales showroom in white with bold coral-pink accents, big blank coral promotional banners
and balloons on the facade (no text), a crowd of miniature customers queueing at sales counters inside, two cars on display
with blank price boards, a coral feather flag at the entrance. Energetic, aggressive, discount-sale mood.

3D miniature diorama game asset, semi-realistic stylized render, high detail, crisp edges, light-grey rounded plinth,
single isolated object, centred, fully transparent background, no ground shadow outside the plinth,
no text, no letters, no numbers, no logos, no brand marks, no watermark.
Output: 1536×1024, building fills about 80% of the frame width.
```

## 2. Golden Naga (premium service, warm gold #e9a23b) → `rivals/golden-naga`
```
Match the camera of the SECOND reference image exactly: orthographic isometric view, no perspective,
ground edges at 24° from horizontal on both sides, all vertical edges perfectly vertical, front corner pointing straight down.
Match its lighting (soft studio light from the top-left), materials and render style.

Building: an elegant three-storey premium insurance headquarters in cream stone with warm gold trim and tall glass windows,
a covered drop-off porch with a dark luxury sedan, a concierge desk visible in the warm-lit lobby, manicured hedges and
two small ornamental trees with soft gold lanterns. Calm, upscale, high-service mood. No serpent or mythological figures.

3D miniature diorama game asset, semi-realistic stylized render, high detail, crisp edges, light-grey rounded plinth,
single isolated object, centred, fully transparent background, no ground shadow outside the plinth,
no text, no letters, no numbers, no logos, no brand marks, no watermark.
Output: 1536×1024, building fills about 80% of the frame width.
```

## 3. BlueWave Direct (digital, teal #22a6c8) → `rivals/bluewave-direct`
```
Match the camera of the SECOND reference image exactly: orthographic isometric view, no perspective,
ground edges at 24° from horizontal on both sides, all vertical edges perfectly vertical, front corner pointing straight down.
Match its lighting (soft studio light from the top-left), materials and render style.

Building: a sleek modern tech-company office, white curved glass volume with teal light strips, an open-plan floor of young staff
at laptops and large blank teal app screens on the walls (no text), a rooftop with solar panels and a small antenna,
a couple of e-scooters parked outside. Fresh, fast, digital-first mood.

3D miniature diorama game asset, semi-realistic stylized render, high detail, crisp edges, light-grey rounded plinth,
single isolated object, centred, fully transparent background, no ground shadow outside the plinth,
no text, no letters, no numbers, no logos, no brand marks, no watermark.
Output: 1536×1024, building fills about 80% of the frame width.
```

## 4. Summit General (conservative, deep violet #7a6ff0) → `rivals/summit-general`
```
Match the camera of the SECOND reference image exactly: orthographic isometric view, no perspective,
ground edges at 24° from horizontal on both sides, all vertical edges perfectly vertical, front corner pointing straight down.
Match its lighting (soft studio light from the top-left), materials and render style.

Building: a solid, traditional four-storey insurance office in light grey stone with deep violet window frames and a violet roof band,
symmetric facade with a heavy entrance and small steps, an archive room with neat filing cabinets visible through a window,
tidy box hedges. Stable, careful, old-established mood.

3D miniature diorama game asset, semi-realistic stylized render, high detail, crisp edges, light-grey rounded plinth,
single isolated object, centred, fully transparent background, no ground shadow outside the plinth,
no text, no letters, no numbers, no logos, no brand marks, no watermark.
Output: 1536×1024, building fills about 80% of the frame width.
```

## 5. (optional) Quiet-quarter lead picture → `events/market-normal`
Used as the front-page picture when no big event happens (currently the EV picture).
```
Use the attached reference only for lighting, materials and palette.
Isometric miniature vignette on a square light-grey rounded plinth, camera ~24° like the reference.
Scene: a calm city intersection on a sunny day, smooth traffic of a few cars, an insurance agent in a blue jacket chatting with a
smiling family next to their new car, trees and planters, a small newspaper kiosk with blank papers (no text).
3D miniature diorama game asset, semi-realistic stylized render, high detail, crisp edges,
single isolated object, centred, fully transparent background,
no text, no letters, no numbers, no logos, no watermark.
Output: 1024×1024.
```


**Status (18 Nov 2026):** all 5 received and in the game (newspaper rival columns, rivals tab, quiet-quarter lead). The rival buildings are front-facing rather than 24° isometric. That is fine for the newspaper and the cards. Regenerate them at 24° only if they should also stand in the city.
