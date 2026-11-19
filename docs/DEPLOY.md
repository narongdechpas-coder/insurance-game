# เผยแพร่เกมบน Cloudflare Pages

repo เป็น private ได้ · ฟรี · push เข้า `main` แล้ว deploy ให้อัตโนมัติ · **ทุกคนที่มีลิงก์เปิดเกมได้**

## ตั้งค่าครั้งแรก (แจ็คทำเอง ราว 5 นาที)

1. สมัคร / เข้าสู่ระบบ https://dash.cloudflare.com
2. เมนู **Workers & Pages** → **Create** → แท็บ **Pages** → **Connect to Git**
3. เชื่อมบัญชี GitHub แล้วให้สิทธิ์เฉพาะ repo `insurance-game`
4. ตั้งค่าการ build:
   | ช่อง | ค่า |
   |---|---|
   | Production branch | `main` |
   | Framework preset | `Vite` (หรือ None) |
   | Build command | `npm run build` |
   | Build output directory | `dist` |
   | Environment variable | `NODE_VERSION` = `22` (มีไฟล์ `.nvmrc` อยู่แล้ว ใส่ซ้ำเพื่อความชัวร์) |
5. กด **Save and Deploy** รอราว 1–2 นาที จะได้ลิงก์ `https://<ชื่อโปรเจกต์>.pages.dev`

## ติดตั้งเป็นแอปบนแท็บเล็ต

- **Android (Galaxy Tab):** เปิดลิงก์ใน Chrome หรือ Samsung Internet → หน้าปกจะมีปุ่ม "ติดตั้งเป็นแอป" มุมขวาบน
- **iPad:** เปิดใน Safari → แตะปุ่ม "ติดตั้งเป็นแอป" เพื่อดูวิธี (แชร์ → เพิ่มไปยังหน้าจอโฮม)
- เปิดเกมครบหนึ่งครั้งตอนมีเน็ต หลังจากนั้นเล่นออฟไลน์ได้

## หลังจากนี้

ทุกครั้งที่ merge PR เข้า `main` Cloudflare จะ build และ deploy ให้เอง แอปที่ติดตั้งไว้จะได้เวอร์ชันใหม่เมื่อเปิดตอนมีเน็ต

## ไฟล์ที่เกี่ยวข้อง

- `public/_headers` — ไม่ให้ cache หน้าเว็บและ service worker เวอร์ชันเก่า
- `.nvmrc` — เวอร์ชัน Node ที่ใช้ build
