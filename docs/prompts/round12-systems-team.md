# Round 12 prompts: team, systems and IT (Engine v3)

**What this round is for.** It covers art for everything added since Engine v3:
- the team screen (people, training, lay-offs)
- the new systems in phase 3a, versions 1 and 2
- the head of IT, who presents the systems the way department heads present their cards
- an optional IT building for the city

**Where to save.** Put every file in `raw-assets/round12/<file name>.png`. If you can't save files on mobile, send them in the chat. Claude trims, sizes and names them, the same as earlier rounds.

**Shared rule.** No real brand names, logos or text appear in any image. All screens and phones in the scenes stay blank or show only simple shapes.

---

## A. Head of IT, half portrait with 3 moods → `it.png`

Attach `public/assets/characters/advisor.png` as the style reference, as in `portraits.md`. Order is left to right: normal | happy | shocked.

```
Match the art style of the reference image exactly: semi-realistic stylized 3D game character, soft studio light from the top-left,
smooth skin shading, clean crisp edges, friendly premium mobile-game look, same proportions and rendering quality.
Character: a Thai man in his early 30s, head of IT and digital, short neat black hair, thin dark-rimmed glasses,
navy zip jacket over a light-blue shirt, a slim company lanyard, holding a small tablet with a glowing blank screen.
Character sheet: the SAME person shown 3 times side by side in one row, evenly spaced with wide empty gaps between them (they must not touch).
Each is a half portrait (head and shoulders down to mid-chest), facing the viewer at a slight 3/4 angle, same size, same crop height, same outfit.
Left: neutral, calm professional expression. Middle: happy, big confident smile, eyes bright. Right: shocked, eyes wide, eyebrows up, mouth open, one hand near the cheek.
Fully transparent background, no floor, no shadow, no frame, no text, no letters, no numbers, no logos, no watermark.
Output: 1536×640, each figure about 420 px wide.
```

---

## B. System cards: 6 systems, one image each (version 2 uses the same image with a badge)

Attach `public/assets/events/ev-growth.webp` as the reference so the plinth, light and colours match the event cards. Paste the shared block below after each scene.

**Shared block (paste after each scene):**
```
Match the lighting, materials and colour palette of the reference image.
Isometric miniature vignette on a square light-grey rounded plinth, camera ~24° like the reference.
3D miniature diorama game asset, semi-realistic stylized render, high detail, crisp edges,
single isolated object, centred, fully transparent background,
no text, no letters, no numbers, no logos, no brand marks, no watermark.
Output: 1024×1024.
```

### B1. LINE OA + chatbot → `sys-chatbot.png`
```
Scene: a cosy customer-service corner where a large floating smartphone shows rounded blank chat bubbles in green and white,
a friendly small round robot assistant with a glowing blue face sits beside the phone answering, a miniature customer on a sofa
relaxing while chatting on their phone, a small clock showing night time with a moon to suggest 24-hour service.
```

### B2. Claims app with tracking → `sys-claims-app.png`
```
Scene: a miniature driver standing next to a white car with a small dent at the roadside, photographing the dent with a phone,
a large floating phone screen beside them shows a blank progress bar with three glowing check circles,
a small camera icon and a stack of blank photo cards flying from the phone toward a tiny claims office with a blue canopy.
```

### B3. Auto renewal → `sys-auto-renew.png`
```
Scene: a large blank insurance card with a blue shield shape in a gentle circular loop of glowing blue arrows,
a calendar page flipping on its own, a small smiling couple on a porch with their car while a tiny confirmation tick floats above,
a feeling of things happening automatically and smoothly.
```

### B4. Partner Portal → `sys-dealer-portal.png`
```
Scene: inside a bright car showroom corner, a salesperson and a happy customer sit at a glass desk beside a shiny new white SUV,
a large blank tablet on a stand prints a small blank policy card instantly from a tiny slot,
thin glowing blue data lines connect the tablet to a small insurance building in the background.
```

### B5. Agent app → `sys-agent-app.png`
```
Scene: a friendly insurance agent in a navy blazer visiting a family at their front door, showing a blank quote on a phone,
small floating blank cards fanning out above the phone (comparing plans), a scooter parked at the gate,
warm late-afternoon light, a sense of quick on-the-spot service.
```

### B6. Garage online → `sys-garage-online.png`
```
Scene: a tidy small repair garage with one car on a lift, a mechanic photographing the damaged bumper with a tablet,
blank photo cards and a blank quote sheet floating from the tablet toward a tiny insurance office icon,
a small box of spare parts arriving on a mini delivery cart, everything clean and efficient.
```

> **Version 2:** Claude adds a small gold "2" badge in the app, so no extra images are needed. If you want version 2 to look clearly different, gen the same scene again with "a futuristic glowing upgrade, small sparkle effects, a subtle gold accent" added.

---

## C. Team screen (optional, for headers and events)

Use the same reference and shared block as section B.

### C1. Training new staff → `ops-training.png`
```
Scene: a small bright training room with rows of desks, five new miniature staff in light-blue shirts with headsets learning,
a trainer pointing at a blank whiteboard with simple shapes, a stack of blank manuals, a warm welcoming mood.
```

### C2. Busy claims team → `ops-claims-team.png`
```
Scene: an open-plan claims office with several miniature staff at desks with blank monitors, neat stacks of blank folders,
a supervisor walking between desks, a wall screen with simple blank bar shapes, steady busy but calm mood.
```

---

## D. (Optional) IT and Digital Center building → `it-center.png`

This is a building for the city, so the system cards have a home in the city and the head of IT has a building to stand in front of. Use the building method from `round2-buildings.md`: attach `docs/angle-guide/building-guide.png`, then attach the HQ image as the second reference.

```
Use the attached reference image as an exact camera and composition guide. Keep the identical true isometric 2:1 camera: orthographic with no perspective, both ground edges of the plinth at 26.6° from horizontal, every vertical edge perfectly vertical, and the front corner of the plinth pointing straight down at the viewer. Keep the same plinth shape and proportions. Replace the white block with the building described below. The main glass facade and the entrance face the BLUE edge of the reference; the short side faces the ORANGE edge. Remove the grid lines and the coloured edge lines.

Building: A compact 3-storey digital and IT centre with a dark-blue glass facade and glowing cyan light strips along each floor, a rooftop with small satellite dishes and a neat row of server cooling units, inside the ground floor a glass-walled server room with blinking blue lights and developers at standing desks with blank screens, a small plaza in front with a bench and a tree.

Style: 3D isometric miniature diorama game asset, semi-realistic stylized render, glossy white and royal-blue modern architecture, soft cinematic studio lighting from the top-left, soft ambient occlusion, warm glowing interior lights, small lush green shrubs and trees on the plinth, light-grey rounded plinth base, high detail, crisp clean edges, premium strategy game art.
Match the camera, lighting, materials and colour palette of the second reference image exactly.

Output: landscape 3:2 at the highest resolution available (1536×1024 or larger), the building filling about 85% of the frame width, single isolated object, centred, fully transparent background, no shadow outside the plinth, no text, no letters, no numbers, no logos, no watermark.
```

---

## Priority

1. **A** (head of IT) and **B1–B6** (the 6 systems): needed for the phase 3a systems screen.
2. **C1–C2**: adds polish to the team screen.
3. **D**: only if we put an IT building in the city. It needs a free plot in the layout, so tell Claude before you gen it.

Until the images exist, the game uses temporary icons, so it plays fine before the art arrives.
