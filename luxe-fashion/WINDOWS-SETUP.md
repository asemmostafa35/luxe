# دليل التثبيت على Windows

## المتطلبات

1. **Node.js** - نزّله من: https://nodejs.org (اختر LTS)
2. **PostgreSQL** - نزّله من: https://www.postgresql.org/download/windows/

---

## الخطوة الوحيدة التي تحتاج تعملها يدويًا

افتح ملف `backend\.env` وعدّل هذا السطر:
```
DATABASE_URL="postgresql://postgres:YOUR_PASSWORD@localhost:5432/luxe_fashion"
```
غيّر `YOUR_PASSWORD` لكلمة مرور PostgreSQL اللي اخترتها وقت التثبيت.

---

## التشغيل

### طريقة 1 — سكريبت تلقائي (الأسهل)
```
Double-click: setup-windows.ps1
```
أو كليك يمين > Run with PowerShell

### طريقة 2 — يدوي

**أولًا: أنشئ قاعدة البيانات**

افتح pgAdmin اللي جاي مع PostgreSQL وأنشئ database اسمها `luxe_fashion`

أو من PowerShell:
```powershell
& "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -c "CREATE DATABASE luxe_fashion;"
```

**ثانيًا: Backend** (PowerShell جديد)
```powershell
cd backend
npm install
npx prisma generate
npx prisma db push
npx ts-node prisma/seed.ts
npm run dev
```

**ثالثًا: Frontend** (PowerShell جديد ثاني)
```powershell
cd frontend
npm install
npm run dev
```

---

## بعد التشغيل

- **الموقع:** http://localhost:3000
- **لوحة الأدمن:** http://localhost:3000/admin
- **Admin:** admin@luxefashion.com / Admin@123
- **Demo User:** demo@luxefashion.com / User@123

---

## مشاكل شائعة على Windows

### خطأ: `prisma generate` يفشل
```powershell
# شغّل هذا بدلًا منه
npx prisma generate --schema=./prisma/schema.prisma
```

### خطأ: `ts-node` غير موجود
```powershell
npm install -g ts-node typescript
npx ts-node prisma/seed.ts
```

### خطأ: PostgreSQL connection refused
- تأكد إن خدمة PostgreSQL شغّالة
- افتح Services.msc وتأكد من `postgresql-x64-16`
- أو شغّل: `net start postgresql-x64-16`

### خطأ: Port 3000 in use
```powershell
# اعرف مين بيستخدم البورت
netstat -ano | findstr :3000
# اوقف الـ process
taskkill /PID [رقم الـ PID] /F
```

### خطأ: sharp module على Windows
```powershell
cd backend
npm install --platform=win32 --arch=x64 sharp
```

---

## ملاحظة مهمة

- الـ **Cash on Delivery** يشتغل مباشرة بدون أي إعداد
- **Stripe** و **PayPal** يحتاجون accounts منفصلة (اختياري للـ development)
- **Email** اختياري — المشروع يشتغل بدونه، الـ emails بس مش هتتبعت
- **Cloudinary** اختياري — Upload هيشتغل locally في مجلد `/uploads`
