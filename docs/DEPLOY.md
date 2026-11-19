# เผยแพร่เกม (Netlify)

ลิงก์เกม: **https://insurance-bkk.netlify.app/**

เว็บนี้เชื่อมกับ repo อยู่แล้ว ทุกครั้งที่ merge เข้า `main` Netlify จะ build และ deploy ให้อัตโนมัติ (ดูสถานะใน Netlify dashboard → Deploys) · **ทุกคนที่มีลิงก์เปิดเกมได้**

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

- **GitHub Pages:** เว็บจะอยู่ใต้ `/insurance-game/` ต้อง build ด้วย `npm run build -- --base=/insurance-game/` (ทดสอบแล้วว่าเกมและโหมดออฟไลน์ทำงานใต้ path นี้ได้)
- **Cloudflare Pages:** Build command `npm run build` · Output `dist` · อ่านไฟล์ `public/_headers` เหมือน Netlify
