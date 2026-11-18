# Round 3 — ภาพที่ยังต้องปรับให้เข้ากับเมืองชุดใหม่

อาคารรอบ 2 ทั้ง 10 หลังผ่านเกณฑ์ 24° แล้ว ภาพที่เหลือในไฟล์นี้ยังเป็นงานรอบแรก ต้อง gen ใหม่ให้มุมกล้องตรงกับเมือง (24°) และให้คมขึ้น

ตรวจจาก `src/assets/sprites.json` เทียบกับโค้ดที่เรียกใช้จริง และวัดมุมด้วย `tools/angle_check.py` (ตรวจวันที่ 18 พ.ย. 2026)

---

## สรุปลำดับความสำคัญ

| ลำดับ | กลุ่ม | จำนวน | ปัญหา | ผลต่อผู้เล่น |
|---|---|---|---|---|
| **1** | รถวิ่งบนถนน | 11 คัน | มุมราว 8° (เมืองใช้ 24°) และภาพกว้างแค่ 180–260 px | **เห็นชัดที่สุด** รถวิ่งเฉียงไม่ตรงเลน |
| **2** | Market Intel (อาคารประดับ) | 1 | ใช้ลูกโลกซ้ำกับ Claims Service | ผู้เล่นอาจคลิกผิดตึก |
| **3** | เฟอร์นิเจอร์ริมถนน | 6 ชิ้น | มุมไม่ตรง หรือภาพเล็ก (Garden island 25°/5°) | เห็นได้ตอนซูมเข้า |
| **4** | ภาพเหตุการณ์ | 3 ภาพ | EV ใช้ไอคอนแทนฉาก ส่วนน้ำท่วมภาพเล็ก (283 px) | การ์ดเหตุการณ์ไม่สม่ำเสมอ |
| **5** | เหตุการณ์ใหม่ (รองรับ Phase 4) | 3 ภาพ | ยังไม่มีภาพ | ต้องมีเมื่อเพิ่มเหตุการณ์ |
| **2** | พื้นหลังเมือง (ถนน หญ้า ทางเท้า น้ำ ฉากไกล) | 5 ภาพ | วาดด้วยโค้ดเป็นสีเรียบ ดูแบนกว่าอาคาร | เห็นทั้งจอตลอดเวลา |

**ไม่ต้องทำใหม่:** Advisor 3 ท่า (820 px คมแล้ว), ภาพคู่แข่ง (`rival-promo`), โลโก้, ภาพปก, ต้นไม้ 3 แบบ (ทรงกลม ไม่มีทิศทาง), เสาไฟ, กรวย, กองยาง และตัวละครเล็กในเมือง (ขนาดบนจอแค่ราว 25 px จึงไม่เห็นมุม)

---

## วิธี gen (ใช้กับทุก prompt ในไฟล์นี้)

1. แนบ reference **2 ภาพ**
   - ภาพที่ 1: `docs/angle-guide/building-guide.png` (หรือ `vehicle-guide.png` สำหรับรถ)
   - ภาพที่ 2: `raw-assets/round2/hq.webp` ใช้ล็อกแสง วัสดุ และมุมกล้องของเมือง
2. วาง prompt ทั้งบล็อก
3. ส่งภาพที่ได้ให้ Claude วัดมุมก่อนใส่เกม เกณฑ์คือ **24° ± 3°**

### Camera + Style block (มีอยู่แล้วในทุก prompt ด้านล่าง ไม่ต้องเติม)
```
Match the camera of the SECOND reference image exactly: orthographic isometric view, no perspective,
ground edges at 24° from horizontal on both sides, all vertical edges perfectly vertical, front corner pointing straight down.
Match its lighting (soft studio light from the top-left), materials (glossy white, royal blue, warm interior glow) and colour palette.
3D miniature diorama game asset, semi-realistic stylized render, high detail, crisp edges,
single isolated object, centred, fully transparent background, no ground shadow outside the object,
no text, no letters, no numbers, no logos, no licence plates, no watermark.
```

---

## 1. รถ (11 คัน) — ทำก่อน

**ทิศทางที่ต้องได้:** หัวรถชี้ไปทาง **ซ้ายล่าง** ตัวรถขนานกับแกนถนน 24° ในเกมรถวิ่ง 2 ทาง ทางหนึ่งใช้ภาพตามที่ gen มา อีกทางใช้ภาพกลับด้าน จึงต้องการภาพเดียวต่อคัน

แนบ `vehicle-guide.png` (ปลายสีเหลืองคือหัวรถ) และ HQ รอบ 2

```
Match the camera of the SECOND reference image exactly: orthographic isometric view, no perspective,
ground edges at 24° from horizontal on both sides, all vertical edges perfectly vertical.
Match its lighting (soft studio light from the top-left), materials and colour palette.
Use the FIRST reference for orientation only: the car body lies along the long block, nose at the yellow end,
so the car drives toward the bottom-left of the frame.

Subject: a {CAR} as a 3D miniature diorama game asset, semi-realistic stylized render, glossy paint, tinted windows,
high detail, crisp edges, wheels touching the ground, no plinth, no road, no ground shadow,
single isolated object, centred, fully transparent background,
no text, no letters, no numbers, no logos, no licence plates, no watermark.
Output: 1024×640.
```

แทน `{CAR}` ทีละคัน แล้วตั้งชื่อไฟล์ตามคอลัมน์ขวา:

| {CAR} | ชื่อไฟล์ |
|---|---|
| white compact sedan | `sedan-white` |
| silver mid-size SUV | `suv-silver` |
| royal-blue mid-size SUV | `suv-blue` |
| red electric hatchback with blue-accent headlights | `ev-red` |
| sky-blue compact electric car | `ev-skyblue` |
| dark-grey luxury SUV | `suv-dark` |
| red sedan | `sedan-red` |
| mint-green electric crossover | `ev-green` |
| lilac compact sedan | `sedan-lilac` |
| silver double-cab pickup truck | `pickup` |
| white family minivan | `van` |
| white flatbed tow truck carrying a damaged grey sedan (optional, for claims events) | `tow-truck` |

---

## 2. Market Intel — เปลี่ยนสัญลักษณ์

ใช้ทรงอาคารเดิม แต่เปลี่ยนลูกโลกเป็นสัญลักษณ์อื่น จะได้ไม่ซ้ำกับ Claims Service

```
Match the camera of the SECOND reference image exactly: orthographic isometric view, no perspective,
ground edges at 24° from horizontal on both sides, all vertical edges perfectly vertical, front corner pointing straight down.
Match its lighting (soft studio light from the top-left), materials (glossy white, royal blue, warm interior glow) and colour palette.

Building: a two-storey classical-modern market intelligence office with white columns and a triangular pediment,
a large glowing blue emblem of a rising bar chart with a magnifying glass above the glass entrance (no globe),
analysts with screens visible through warm-lit windows, neat hedges, light-grey rounded plinth.

3D miniature diorama game asset, semi-realistic stylized render, high detail, crisp edges,
single isolated object, centred, fully transparent background, no ground shadow outside the plinth,
no text, no letters, no numbers, no logos, no watermark.
Output: 1536×1024, building fills about 85% of the frame width.
```
ชื่อไฟล์: `market-intel`

---

## 3. เฟอร์นิเจอร์ริมถนน (6 ชิ้น)

ใน prompt เดียวกันนี้ เปลี่ยนเฉพาะบรรทัด `Subject:`

```
Match the camera of the SECOND reference image exactly: orthographic isometric view, no perspective,
ground edges at 24° from horizontal on both sides, all vertical edges perfectly vertical, front corner pointing straight down.
Match its lighting (soft studio light from the top-left), materials (glossy white, royal blue, warm glow) and colour palette.

Subject: {ITEM}

3D miniature diorama game asset, semi-realistic stylized render, high detail, crisp edges,
single isolated object, centred, fully transparent background, no ground shadow outside the object,
no text, no letters, no numbers, no logos, no watermark.
Output: 1024×1024.
```

| {ITEM} | ชื่อไฟล์ | ใช้ที่ไหน |
|---|---|---|
| a covered bus stop with a curved royal-blue glass roof, white frame and a wooden bench, on a small square paved plinth | `bus-stop` | ริมถนนใหญ่ |
| a wooden park bench with white metal legs on a small square paved plinth | `bench` | ริมถนนใหญ่ |
| a white rectangular planter box with lush green shrubs and small white flowers | `planter` | ทางเท้า |
| a small landscaped garden island on a rounded plinth: lawn, a pink flowering tree, shrubs, a curved stone path, two warm garden lamps | `garden-island` | ฝั่งซ้ายของเมือง |
| a covered carport with a curved royal-blue roof sheltering two parked cars, on a rectangular paved plinth | `carport` | สำรองไว้ใช้ภายหลัง |
| an outdoor café terrace on a rectangular paved plinth: three white umbrellas, round wooden tables, rattan chairs, seated customers | `cafe-terrace` | สำรองไว้ใช้ภายหลัง |

---

## 4. ภาพเหตุการณ์ที่ใช้อยู่ (ขึ้นบนการ์ดและ bubble)

ภาพเหล่านี้แสดงขนาดเล็ก (64–90 px) จึงไม่ต้องตรงมุมเป๊ะ แต่ควรเป็นฉากบนฐานสี่เหลี่ยมแบบเดียวกับ `rival-promo`

```
Match the lighting, materials and colour palette of the SECOND reference image.
Isometric miniature vignette on a square light-grey rounded plinth, camera ~24° like the reference.

Scene: {SCENE}

3D miniature diorama game asset, semi-realistic stylized render, high detail, crisp edges,
single isolated object, centred, fully transparent background,
no text, no letters, no numbers, no logos, no watermark.
Output: 1024×1024.
```

| {SCENE} | ชื่อไฟล์ | เหตุการณ์ |
|---|---|---|
| a modern EV showroom corner with a white electric SUV plugged into a glowing blue charger, excited miniature customers, a blank blue banner with a lightning-bolt shape | `events/ev-growth` | ตลาด EV โตต่อเนื่อง (ตอนนี้ใช้ไอคอนแทน) |
| a flooded city street: brown floodwater up to the car doors, two half-submerged cars, sandbags, a worried family on a raised doorstep, dark rain clouds above the plinth | `events/flood` | เสี่ยงน้ำท่วมภาคกลาง (ภาพเดิมเล็ก) |

---

## 5. เหตุการณ์ใหม่ (เตรียมไว้สำหรับ Phase 4)

ใช้ prompt เดียวกับข้อ 4

| {SCENE} | ชื่อไฟล์ |
|---|---|
| a miniature city block under a grey overcast sky with a large glossy red 3D downward arrow sculpture (no numbers), shop shutters half closed, worried people | `events/economy` |
| a white classical government building with columns, a giant clipboard and a rubber-stamp sculpture beside it (blank paper), miniature officials holding documents | `events/regulation` |
| a car accident scene at an intersection: two lightly crashed cars, a surveyor in a blue jacket with a tablet, a tow truck arriving, traffic cones | `events/claims-surge` |

---

## 6. พื้นหลังเมือง (ถนน แม่น้ำ สนามหญ้า ทางเท้า)

### แนวทาง: ตำแหน่งเก็บไว้ในโค้ด ส่วนผิวเปลี่ยนเป็นภาพ gen

**ไม่แนะนำให้ gen พื้นทั้งเมืองเป็นภาพใหญ่ภาพเดียว** เหตุผลข้อเดียวที่หนักที่สุดคือ ถนนกับแปลงที่ดินต้องตรงกับตำแหน่งอาคารและเลนรถในโค้ดแบบพอดีพิกเซล แต่ AI วางตำแหน่งให้ตรงแบบนั้นไม่ได้ และถ้าย้ายอาคารหลังเดียวก็ต้อง gen ใหม่ทั้งภาพ นอกจากนี้พื้นทั้งเมืองต้องใหญ่ราว 4000 px แต่เครื่องมือ gen ทำได้สูงสุดราว 1536 px ขยายแล้วจะเบลอ

ทางที่แนะนำแบ่งเป็น 3 ส่วน:

| ส่วน | ใครทำ | หมายเหตุ |
|---|---|---|
| ตำแหน่งถนน ทางเท้า แปลงหญ้า แนวแม่น้ำ | **โค้ด (เหมือนเดิม)** | ตรงกับอาคารและเลนรถเสมอ |
| ผิวของแต่ละพื้น (ยางมะตอย หญ้า ทางเท้า น้ำ) | **gen เป็น texture แบบต่อกันได้ไม่มีรอยต่อ** | โค้ดจะบิดภาพให้เป็นมุม 24° ให้เอง จึง gen เป็นภาพมุมบนตรงๆ ได้ |
| ฉากไกลหลังแม่น้ำ (เมือง ภูเขา วัด) | **gen เป็นภาพแถบยาว** | อยู่ไกลสุด จึงไม่ต้องตรงพิกเซล |

**ฝั่งโค้ด (Claude ทำเมื่อได้ภาพ):**
- เพิ่มความหนาให้ขอบทางเท้าและขอบแปลงหญ้า ให้ดูยกขึ้นเหมือนฐานอาคาร
- ใส่เส้นขอบถนนและเงาใต้ขอบ
- ทำเขื่อนริมแม่น้ำให้มีความหนา
- ทำผิวน้ำแบบไล่สี + ระลอกคลื่นขยับได้

### 6.1 Texture ต่อกันได้ (4 ภาพ)

ไม่ต้องแนบ reference มุมกล้อง เพราะเป็นภาพมุมบนตรงๆ แต่แนบภาพ HQ รอบ 2 ได้ ช่วยให้โทนสีตรงกับเมือง

```
Seamless tileable texture, perfectly top-down orthographic view (camera straight down, no perspective, no horizon),
the left edge continues into the right edge and the top edge into the bottom edge with no visible seam,
even soft lighting with no directional shadows, stylized semi-realistic miniature diorama look matching the reference image's palette,
no objects, no text, no letters, no numbers, no markings unless stated.

Surface: {SURFACE}
Output: 1024×1024.
```

| {SURFACE} | ชื่อไฟล์ |
|---|---|
| clean dark blue-grey asphalt road surface with very fine grain and subtle tonal variation, no lane lines, no cracks | `textures/asphalt` |
| short lush green lawn grass, fresh spring green with slightly varied blades and a few tiny darker patches, miniature-model look | `textures/grass` |
| light warm-grey square paving stones about 1/8 of the tile width each, thin soft joints, gentle tone variation between stones | `textures/paving` |
| calm clear river water seen from above, bright sky-blue to deep blue gradient-free uniform tone, soft small ripples and gentle highlights | `textures/water` |

**วิธีเช็คหลัง gen:** Claude จะวางภาพเรียงต่อกัน 2×2 ดูว่ามีรอยต่อไหม ถ้ามีรอยต่อจะซ่อมด้วยโค้ดได้ (ทำ offset + blend) ไม่ต้อง gen ใหม่

### 6.2 ฉากไกลหลังแม่น้ำ (1 ภาพ)

แนบ `public/assets/brand/cover.jpg` เป็น reference ภาพนี้มีฝั่งตรงข้ามแม่น้ำในสไตล์ที่ต้องการอยู่แล้ว

```
Use the reference image only for style and palette (the hazy city and green hills across the river).
A wide panoramic backdrop strip for a game background: a distant riverside city skyline seen from a high isometric angle,
soft blue-grey modern towers, low green hills behind, a Thai temple with golden spires and orange tiered roofs near the centre,
an arched white bridge at the right end, a green river bank with small trees along the bottom edge.
Strong atmospheric perspective: low detail, slightly hazy and desaturated so it stays behind the main city.
The bottom edge is a straight horizontal tree-lined bank; the top fades into fully transparent sky.
No foreground objects, no text, no letters, no numbers, no logos, no watermark.
Output: 3000×700 (or the widest landscape size available), transparent above the skyline.
```
ชื่อไฟล์: `environments/far-bank`

**หมายเหตุ:** แม่น้ำในเกมทำมุม 24° แต่ภาพนี้ขอให้ฝั่งล่างเป็นแนวนอนตรง ทางโค้ดจะเอียงภาพให้เข้ากับแม่น้ำเอง เพราะอยู่ไกลและมีหมอก รอยบิดเล็กน้อยจะมองไม่ออก

---

## ภาพที่ลบได้ (ไม่ได้ใช้ในเกมแล้ว)

`characters/advisor-small`, `environments/guard-gate`, `ev-chargers`, `flag-pair`, `flag-planter`, `fountain-plaza`, `tree-small`, `events/flood-warning`, `storm`, `landslide`, `icons/shield`

ถ้าแจ็คตกลง Claude จะลบออกจาก manifest ตอนนำเข้าภาพรอบ 3 ภาพ `storm` กับ `landslide` อาจเก็บไว้ใช้เป็นเหตุการณ์ภัยพิบัติใน Phase 4 ได้

---

## หลังได้ภาพแล้ว (ฝั่ง Claude)

- วัดมุมทุกภาพด้วย `tools/angle_check.py` เกณฑ์ 24° ± 3° ยกเว้นภาพเหตุการณ์
- ปรับ scale ของรถใน `src/world/Traffic.tsx` เพราะภาพใหม่ใหญ่ขึ้นราว 4 เท่า
- นำเข้าเป็น WebP ผ่าน `raw-assets/manifest.json` (ส่วน `singles`)
- เปลี่ยนการ์ด EV จากไอคอนเป็นภาพฉาก ใน `src/world/eventArt.ts`
