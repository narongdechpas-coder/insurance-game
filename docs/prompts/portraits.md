# Prompts — half portraits (advisor + 7 department heads, 3 moods each)

**Use:** the half portraits appear in four places:
- the AI Advisor box, which replaces the full-body figure
- the location panel when a building is clicked
- the strategy card header in the Decision Room
- the "ทำไมผลออกมาแบบนี้" list in Quarterly Review

Each department head's face changes with the situation.

**One image = one person, 3 moods side by side.** Order is always left → right: **normal | happy | shocked**. Claude slices each sheet into 3 files.

**How to gen:**
- Attach `public/assets/characters/advisor.png` as the style reference so every character comes from the same game.
- Paste one block per image.
- Save results to `raw-assets/round10/<file>.png`, using the names in the headings (e.g. `raw-assets/round10/claims.png`).

**Rules that keep the slicing clean:** the 3 figures must not touch, and there must be clear empty space between them. The background must be fully transparent. Each figure is cut off at mid-chest at the same height. No text.

**Shared block (already included in every prompt below):**
```
Match the art style of the reference image exactly: semi-realistic stylized 3D game character, soft studio light from the top-left,
smooth skin shading, clean crisp edges, friendly premium mobile-game look, same proportions and rendering quality.
Character sheet: the SAME person shown 3 times side by side in one row, evenly spaced with wide empty gaps between them (they must not touch).
Each is a half portrait (head and shoulders down to mid-chest), facing the viewer at a slight 3/4 angle, same size, same crop height, same outfit.
Left: neutral, calm professional expression. Middle: happy, big confident smile, eyes bright. Right: shocked, eyes wide, eyebrows up, mouth open, one hand near the cheek.
Fully transparent background, no floor, no shadow, no frame, no text, no letters, no numbers, no logos, no watermark.
Output: 1536×640, each figure about 420 px wide.
```

---

## 0. Advisor "น้องพลอย" (replaces the full body) → `raw-assets/round10/advisor.png`
```
Match the art style of the reference image exactly: semi-realistic stylized 3D game character, soft studio light from the top-left,
smooth skin shading, clean crisp edges, friendly premium mobile-game look, same proportions and rendering quality.
Character: the SAME young Thai businesswoman as the reference image, same face, same long wavy brown hair, same navy blazer,
white blouse and small gold pin. She holds a tablet against her chest.
Character sheet: the SAME person shown 3 times side by side in one row, evenly spaced with wide empty gaps between them (they must not touch).
Each is a half portrait (head and shoulders down to mid-chest), facing the viewer at a slight 3/4 angle, same size, same crop height, same outfit.
Left: neutral, warm attentive smile. Middle: happy, big smile, giving a small thumbs-up. Right: worried and shocked, eyes wide, eyebrows up, hand near the cheek.
Fully transparent background, no floor, no shadow, no frame, no text, no letters, no numbers, no logos, no watermark.
Output: 1536×640, each figure about 420 px wide.
```

## 1. HQ / pricing — head of underwriting → `raw-assets/round10/hq.png`
```
Match the art style of the reference image exactly: semi-realistic stylized 3D game character, soft studio light from the top-left,
smooth skin shading, clean crisp edges, friendly premium mobile-game look, same proportions and rendering quality.
Character: a Thai man in his late 40s, the chief underwriter. Short neat grey-black hair, thin rectangular glasses,
dark charcoal three-piece suit with a royal-blue tie, a slim gold pen in his breast pocket. Serious, analytical look.
Character sheet: the SAME person shown 3 times side by side in one row, evenly spaced with wide empty gaps between them (they must not touch).
Each is a half portrait (head and shoulders down to mid-chest), facing the viewer at a slight 3/4 angle, same size, same crop height, same outfit.
Left: neutral, calm professional expression. Middle: happy, big confident smile, eyes bright. Right: shocked, eyes wide, eyebrows up, mouth open, one hand near the cheek.
Fully transparent background, no floor, no shadow, no frame, no text, no letters, no numbers, no logos, no watermark.
Output: 1536×640, each figure about 420 px wide.
```

## 2. Dealer network — partnership manager → `raw-assets/round10/dealer.png`
```
Match the art style of the reference image exactly: semi-realistic stylized 3D game character, soft studio light from the top-left,
smooth skin shading, clean crisp edges, friendly premium mobile-game look, same proportions and rendering quality.
Character: a Thai man in his early 30s, a car-dealer partnership manager. Styled short hair, light-blue shirt with sleeves rolled up,
navy vest, a lanyard with a blank ID card, a car key fob held in one hand. Outgoing salesman energy.
Character sheet: the SAME person shown 3 times side by side in one row, evenly spaced with wide empty gaps between them (they must not touch).
Each is a half portrait (head and shoulders down to mid-chest), facing the viewer at a slight 3/4 angle, same size, same crop height, same outfit.
Left: neutral, calm professional expression. Middle: happy, big confident smile, eyes bright. Right: shocked, eyes wide, eyebrows up, mouth open, one hand near the cheek.
Fully transparent background, no floor, no shadow, no frame, no text, no letters, no numbers, no logos, no watermark.
Output: 1536×640, each figure about 420 px wide.
```

## 3. Marketing & brand — brand manager → `raw-assets/round10/marketing.png`
```
Match the art style of the reference image exactly: semi-realistic stylized 3D game character, soft studio light from the top-left,
smooth skin shading, clean crisp edges, friendly premium mobile-game look, same proportions and rendering quality.
Character: a Thai woman in her late 20s, a creative brand manager. Shoulder-length bob with a small hair clip, trendy round glasses,
cream turtleneck under a bright cobalt-blue blazer, holding a small blank colour-swatch fan. Creative, lively look.
Character sheet: the SAME person shown 3 times side by side in one row, evenly spaced with wide empty gaps between them (they must not touch).
Each is a half portrait (head and shoulders down to mid-chest), facing the viewer at a slight 3/4 angle, same size, same crop height, same outfit.
Left: neutral, calm professional expression. Middle: happy, big confident smile, eyes bright. Right: shocked, eyes wide, eyebrows up, mouth open, one hand near the cheek.
Fully transparent background, no floor, no shadow, no frame, no text, no letters, no numbers, no logos, no watermark.
Output: 1536×640, each figure about 420 px wide.
```

## 4. Customers — contact-centre lead → `raw-assets/round10/customers.png`
```
Match the art style of the reference image exactly: semi-realistic stylized 3D game character, soft studio light from the top-left,
smooth skin shading, clean crisp edges, friendly premium mobile-game look, same proportions and rendering quality.
Character: a Thai woman in her early 30s, the customer contact-centre lead. Hair in a neat low ponytail, wearing a slim headset
with a microphone, sky-blue uniform polo with a white collar and a blank name badge. Warm, caring look.
Character sheet: the SAME person shown 3 times side by side in one row, evenly spaced with wide empty gaps between them (they must not touch).
Each is a half portrait (head and shoulders down to mid-chest), facing the viewer at a slight 3/4 angle, same size, same crop height, same outfit.
Left: neutral, calm professional expression. Middle: happy, big confident smile, eyes bright. Right: shocked, eyes wide, eyebrows up, mouth open, one hand near the cheek.
Fully transparent background, no floor, no shadow, no frame, no text, no letters, no numbers, no logos, no watermark.
Output: 1536×640, each figure about 420 px wide.
```

## 5. Claims service — claims surveyor → `raw-assets/round10/claims.png`
```
Match the art style of the reference image exactly: semi-realistic stylized 3D game character, soft studio light from the top-left,
smooth skin shading, clean crisp edges, friendly premium mobile-game look, same proportions and rendering quality.
Character: a Thai man in his mid 30s, a field claims surveyor. Short hair, a navy cap, white shirt under a high-visibility
navy-and-yellow reflective vest, holding a clipboard with a blank form. Practical, on-site look.
Character sheet: the SAME person shown 3 times side by side in one row, evenly spaced with wide empty gaps between them (they must not touch).
Each is a half portrait (head and shoulders down to mid-chest), facing the viewer at a slight 3/4 angle, same size, same crop height, same outfit.
Left: neutral, calm professional expression. Middle: happy, big confident smile, eyes bright. Right: shocked, eyes wide, eyebrows up, mouth open, one hand near the cheek.
Fully transparent background, no floor, no shadow, no frame, no text, no letters, no numbers, no logos, no watermark.
Output: 1536×640, each figure about 420 px wide.
```

## 6. Repair network — garage chief → `raw-assets/round10/repair.png`
```
Match the art style of the reference image exactly: semi-realistic stylized 3D game character, soft studio light from the top-left,
smooth skin shading, clean crisp edges, friendly premium mobile-game look, same proportions and rendering quality.
Character: a Thai man in his early 40s, the head mechanic of the partner garage network. Stocky build, short buzz cut,
navy mechanic coveralls with the top unzipped over a white T-shirt, a small grease smudge on the cheek, a wrench over one shoulder.
Character sheet: the SAME person shown 3 times side by side in one row, evenly spaced with wide empty gaps between them (they must not touch).
Each is a half portrait (head and shoulders down to mid-chest), facing the viewer at a slight 3/4 angle, same size, same crop height, same outfit.
Left: neutral, calm professional expression. Middle: happy, big confident smile, eyes bright. Right: shocked, eyes wide, eyebrows up, mouth open, one hand near the cheek.
Fully transparent background, no floor, no shadow, no frame, no text, no letters, no numbers, no logos, no watermark.
Output: 1536×640, each figure about 420 px wide.
```

## 7. Risk & reinsurance — risk analyst → `raw-assets/round10/risk.png`
```
Match the art style of the reference image exactly: semi-realistic stylized 3D game character, soft studio light from the top-left,
smooth skin shading, clean crisp edges, friendly premium mobile-game look, same proportions and rendering quality.
Character: a Thai woman in her late 30s, the chief risk and reinsurance officer. Hair in a sleek bun, pearl stud earrings,
tailored dark-teal suit with a white blouse, holding a slim tablet that shows a blank glowing blue chart. Calm, sharp, strategic look.
Character sheet: the SAME person shown 3 times side by side in one row, evenly spaced with wide empty gaps between them (they must not touch).
Each is a half portrait (head and shoulders down to mid-chest), facing the viewer at a slight 3/4 angle, same size, same crop height, same outfit.
Left: neutral, calm professional expression. Middle: happy, big confident smile, eyes bright. Right: shocked, eyes wide, eyebrows up, mouth open, one hand near the cheek.
Fully transparent background, no floor, no shadow, no frame, no text, no letters, no numbers, no logos, no watermark.
Output: 1536×640, each figure about 420 px wide.
```

---

**After generating:** Claude runs `detect` on each sheet (it should find exactly 3 blobs), then exports them as `portraits/<dept>-normal|happy|shocked` at 420 px. The code switches to the portraits automatically. Until a file exists, each spot keeps its current art.
