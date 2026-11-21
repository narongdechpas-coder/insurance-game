# เผยแพร่เกม

มี 2 ลิงก์:

| | ลิงก์ | อัปเดตเมื่อไร |
|---|---|---|
| **พรีวิว** (GitHub Pages) | https://narongdechpas-coder.github.io/insurance-game/ | อัตโนมัติทุกครั้งที่ merge เข้า `main` (`.github/workflows/pages.yml`) |
| **เว็บจริง** (Netlify) | **https://insurance-bkk.netlify.app/** | เฉพาะ commit ที่มีคำว่า `[deploy]` ในข้อความ |

ใช้ลิงก์พรีวิวดูงานระหว่างพัฒนาได้จากทุกเครื่อง (ไม่ต้องรัน localhost) และ deploy ขึ้น Netlify เฉพาะตอนพร้อม เพื่อไม่ให้โควตา Netlify หมด · ทุกคนที่มีลิงก์เปิดได้ทั้งสองลิงก์

## วิธี deploy ขึ้น Netlify

ใส่ `[deploy]` ในข้อความของ commit ที่เข้า `main` (กับ squash merge คือหัวข้อ PR/commit) เช่น `Release: intro deck [deploy]`
- กติกาอยู่ที่ `ignore` ใน `netlify.toml`: commit ที่ไม่มี `[deploy]` Netlify จะข้ามการ build (ผลเดียวกันกับ Deploy Preview ของ PR)

## พรีวิวบน GitHub Pages

- build ด้วย `npm run build -- --base=/insurance-game/` แล้วคัดลอก `index.html` เป็น `404.html` เพื่อให้เปิดลิงก์ตรง เช่น `/insurance-game/intro` ได้ (Pages ไม่มี redirect)
- ต้องเปิดครั้งเดียวที่ Settings → Pages → Source: **GitHub Actions** (เปิดแล้ว)
- ดูสถานะได้ที่แท็บ Actions ของ repo · สั่งรันใหม่ได้จาก Actions → Preview on GitHub Pages → Run workflow
- แอปที่ติดตั้งจากลิงก์พรีวิวกับจาก Netlify เป็นคนละแอปกัน แนะนำให้ใช้ลิงก์พรีวิวผ่านเบราว์เซอร์อย่างเดียว

## ตั้งค่า Netlify

การตั้งค่าอยู่ใน `netlify.toml` ไม่ต้องตั้งในหน้าเว็บ Netlify:
- build: `npm run build` → โฟลเดอร์ `dist` · Node 22
- หน้าเว็บ, manifest และ service worker ไม่ถูก cache (ผู้เล่นได้เวอร์ชันใหม่ทันทีที่เปิดตอนมีเน็ต)
- ไฟล์ใน `/assets/` cache 1 วัน (ภาพในเกมใช้ชื่อไฟล์เดิมเวลาเปลี่ยนภาพ จึงห้าม cache นาน)

## ติดตั้งเป็นแอปบนแท็บเล็ต

- **Android (Galaxy Tab):** เปิดลิงก์ใน Chrome หรือ Samsung Internet → หน้าปกจะมีปุ่ม "ติดตั้งเป็นแอป" มุมขวาบน
- **iPad:** เปิดใน Safari → แตะปุ่ม "ติดตั้งเป็นแอป" เพื่อดูวิธี (แชร์ → เพิ่มไปยังหน้าจอโฮม)
- เปิดเกมครบหนึ่งครั้งตอนมีเน็ต หลังจากนั้นเล่นออฟไลน์ได้

## เมื่อเปลี่ยนภาพในเกม

แอปที่ติดตั้งไว้เก็บภาพไว้ในเครื่อง (service worker) ถ้าเปลี่ยนภาพโดยใช้ชื่อไฟล์เดิม ให้เปลี่ยน `VERSION` ใน `public/sw.js` (เช่น `iu-v1` → `iu-v2`) เครื่องที่ติดตั้งไว้จะโหลดภาพใหม่เมื่อเปิดตอนมีเน็ต โค้ดเกมไม่ต้องทำอะไร เพราะชื่อไฟล์เปลี่ยนเองทุก build

## ถ้าวันหนึ่งต้องย้าย

- **GitHub Pages:** ใช้เป็นพรีวิวอยู่แล้ว (ดูด้านบน) ถ้าจะใช้เป็นเว็บจริงก็ใช้ลิงก์พรีวิวได้เลย
- **Cloudflare Pages:** Build command `npm run build` · Output `dist` · อ่านไฟล์ `public/_headers` เหมือน Netlify
