# Prompts — high-season events (Motor Show, Motor Expo, year-end promotion)

**Use:** art for the three seasonal events added in 2b. It appears on the event card (64–90 px), the event bubble in the city and the scenario page in the Decision Room. The style is the same as the existing event art (`events/ev-growth`, `events/flood`).

**How to gen:**
- Attach `public/assets/events/rival-promo.png` as the reference image, so the plinth, light and colour match the other event cards.
- Paste one block per image.
- Save the results to `raw-assets/round11/<file>.png`. If you can't save files on mobile, send them in chat.

**Important:** "Motor Show" and "Motor Expo" are real event names. The art must not show event logos, car-brand logos or any text. Draw the *feel* of a big car fair, not the real event. The two images must look clearly different from each other: Motor Show is a daytime spring fair, Motor Expo is an evening year-end fair.

---

## 1. Motor Show (Q2) → `events/motor-show`
```
Match the lighting, materials and colour palette of the reference image.
Isometric miniature vignette on a square light-grey rounded plinth, camera ~24° like the reference.

Scene: a bright daytime car fair inside a huge exhibition hall with a high white truss roof and skylights;
three shiny new cars on round rotating display stages (one white SUV, one red sedan, one sky-blue electric car),
crowds of miniature visitors taking photos, a small insurance counter with a blue canopy where a salesperson
hands a brochure to a happy young couple, blank colourful hanging banners with no text, fresh spring mood.

3D miniature diorama game asset, semi-realistic stylized render, high detail, crisp edges,
single isolated object, centred, fully transparent background,
no text, no letters, no numbers, no logos, no brand marks, no watermark.
Output: 1024×1024.
```

## 2. Motor Expo (Q4) → `events/motor-expo`
```
Match the lighting, materials and colour palette of the reference image.
Isometric miniature vignette on a square light-grey rounded plinth, camera ~24° like the reference.

Scene: an evening year-end car expo hall with dramatic warm spotlights and glowing gold and deep-blue lighting,
a festive mood with small gold star decorations and a few red-and-gold gift boxes,
a glossy black luxury sedan and a white pickup truck on lit stages, long queues of miniature buyers signing papers
at sales desks, an insurance desk with a blue canopy and a small stack of blank gift vouchers,
blank glowing screens and banners with no text.

3D miniature diorama game asset, semi-realistic stylized render, high detail, crisp edges,
single isolated object, centred, fully transparent background,
no text, no letters, no numbers, no logos, no brand marks, no watermark.
Output: 1024×1024.
```

## 3. (recommended) Year-end promotion race, Q4 → `events/year-end-promo`
The Q4 event where every insurer pushes promotions to hit its annual target. It differs from `rival-promo`, which is one rival cutting prices: this picture is the whole market racing.
```
Match the lighting, materials and colour palette of the reference image.
Isometric miniature vignette on a square light-grey rounded plinth, camera ~24° like the reference.

Scene: a busy street corner of small insurance shopfronts side by side, each in a different colour
(coral, gold, teal, violet, blue), every shop covered in blank sale banners, balloons and confetti,
salespeople with megaphones calling to passing customers, a large blank calendar board showing the last page of the year,
a sense of a race to the finish line with a small chequered finish-line ribbon across the street.

3D miniature diorama game asset, semi-realistic stylized render, high detail, crisp edges,
single isolated object, centred, fully transparent background,
no text, no letters, no numbers, no logos, no brand marks, no watermark.
Output: 1024×1024.
```

---

**After generating:** Claude crops each image, exports it to `public/assets/events/` at 640 px and links the event's `icon` to it in `src/world/eventArt.ts`. Until the art exists, the cards use the dealer building art as a placeholder.
