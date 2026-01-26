# Vilekula - Evidence pokroku žáků

Webová aplikace pro slovní hodnocení žáků v alternativní základní škole.

## Funkce

- ✅ Přihlášení učitelů (email + heslo)
- ✅ Přehled tříd a žáků
- ✅ Zadávání hodnocení k očekávaným výstupům
- ✅ Export do Markdown pro slovní hodnocení
- ✅ Admin správa tříd a uživatelů
- ✅ Audit log změn hodnocení

## Technologie

- **Frontend:** React + Vite + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + API)
- **Hosting:** Vercel

## Lokální vývoj

### 1. Naklonuj repozitář

```bash
git clone https://github.com/TVOJE_USERNAME/vilekula-pokrok.git
cd vilekula-pokrok
```

### 2. Nainstaluj závislosti

```bash
npm install
```

### 3. Vytvoř `.env` soubor

Zkopíruj `.env.example` na `.env` a doplň hodnoty ze Supabase:

```bash
cp .env.example .env
```

Hodnoty najdeš v **Supabase Dashboard → Settings → API**:
- `VITE_SUPABASE_URL` = Project URL
- `VITE_SUPABASE_ANON_KEY` = anon/public key

### 4. Spusť vývojový server

```bash
npm run dev
```

Aplikace poběží na `http://localhost:5173`

## Deploy na Vercel

### 1. Nahraj kód na GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/TVOJE_USERNAME/vilekula-pokrok.git
git push -u origin main
```

### 2. Propoj s Vercelem

1. Jdi na [vercel.com](https://vercel.com) a přihlas se přes GitHub
2. Klikni **"Add New Project"**
3. Vyber repozitář `vilekula-pokrok`
4. V sekci **Environment Variables** přidej:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
5. Klikni **Deploy**

## Struktura projektu

```
vilekula-pokrok/
├── src/
│   ├── components/      # Sdílené komponenty
│   │   └── Layout.jsx   # Hlavní layout s navigací
│   ├── hooks/
│   │   └── useAuth.jsx  # Autentizační context
│   ├── lib/
│   │   └── supabase.js  # Supabase client
│   ├── pages/
│   │   ├── Login.jsx           # Přihlášení
│   │   ├── Dashboard.jsx       # Přehled tříd
│   │   ├── TridaDetail.jsx     # Seznam žáků ve třídě
│   │   ├── ZakHodnoceni.jsx    # Formulář hodnocení
│   │   ├── AdminTridy.jsx      # Správa tříd a žáků
│   │   └── AdminUzivatele.jsx  # Správa učitelů
│   ├── App.jsx          # Routing
│   ├── main.jsx         # Entry point
│   └── index.css        # Tailwind styles
├── .env.example         # Šablona environment variables
├── package.json
├── vite.config.js
└── tailwind.config.js
```

## Přidání nového učitele

1. V **Supabase Dashboard → Authentication → Users** vytvoř nového uživatele
2. Zkopíruj jeho **User UID**
3. V **SQL Editor** spusť:

```sql
INSERT INTO ucitel (id, email, jmeno, prijmeni, role)
VALUES (
  'USER_UID_ZDE',
  'email@skola.cz',
  'Jméno',
  'Příjmení',
  'ucitel'  -- nebo 'admin'
);
```

4. V aplikaci přiřaď učitele ke třídám

## Přechod do nového školního roku

Funkce `prechod_rocniku` vytvoří nové třídy a přesune žáky:

```sql
SELECT * FROM prechod_rocniku('2025/26', '2026/27');
```

## Licence

Proprietární - ZŠ Vilekula Teplice
