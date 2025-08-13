# API 403 Kļūdas Novēršanas Ceļvedis

## Problēmas apraksts
PUT pieprasījumi uz `/api/products` atgriež 403 "Neatļauts pieprasījums" kļūdu.

## Veiktās izmaiņas

### 1. Environment Variables (.env)
```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NODE_ENV=development
```

### 2. API Route uzlabojumi (src/app/api/products/route.ts)
- ✅ Uzlabota CSRF validācija ar debug informāciju
- ✅ Detalizēta admin tiesību pārbaude
- ✅ Pilnīga error handling ar debug info
- ✅ Console logging visiem soļiem

### 3. Frontend uzlabojumi (ProductModal.tsx)
- ✅ Pievienoti pareizi headers (Origin, X-Requested-With)
- ✅ Credentials: 'same-origin'
- ✅ Uzlabots error handling ar 403 specifiskiem ziņojumiem
- ✅ Debug logging request/response datiem

### 4. Supabase Client uzlabojumi (lib/supabase/server.ts)
- ✅ Labāks error handling
- ✅ Environment variables validācija
- ✅ Cookie debugging

### 5. Debug Utilities (lib/debug.ts)
- ✅ CSRF requirements checker
- ✅ Environment validation
- ✅ Auth debug helpers

### 6. Test Utilities (lib/test-api.ts)
- ✅ Browser console test funkcijas
- ✅ CSRF testēšana
- ✅ Auth status pārbaude

## Testēšanas soļi

### 1. Restartē serveri
```bash
npm run dev
# vai
yarn dev
```

### 2. Pārbaudi browser console
1. Atver Developer Tools (F12)
2. Ej uz Console tab
3. Mēģini labot produktu
4. Apsati console ziņojumus

### 3. Izmanto test utilities
Browser console:
```javascript
// Testē autentifikāciju
await window.testAPI.testAuth()

// Testē CSRF requirements
await window.testAPI.testCSRF()

// Testē PUT request
await window.testAPI.testProductsPUT('your-product-id')
```

### 4. Pārbaudi server console
Terminal, kur darbojas Next.js server - apsati detalizētos debug ziņojumus.

## Biežākās problēmas un risinājumi

### 1. CSRF Validation Failed
**Simptomi:** `CSRF validation failed for PUT request`
**Risinājums:**
- Pārbaudi, vai ir iestatīts `NEXT_PUBLIC_SITE_URL`
- Pārbaudi request headers browser Network tab

### 2. Admin Permissions Check Failed
**Simptomi:** `Nav admin tiesību`
**Risinājums:**
- Pārbaudi, vai esi pieteicies
- Pārbaudi database `profiles` tabulu - vai tavs user ir `role: 'admin'`

### 3. Supabase Authentication Issues
**Simptomi:** `Neautorizēts lietotājs`
**Risinājums:**
- Pārbaudi cookies browser Application tab
- Mēģini atkal pieteikties
- Pārbaudi Supabase environment variables

### 4. Rate Limiting
**Simptomi:** `Pārāk daudz pieprasījumu`
**Risinājums:**
- Gaidi 1 minūti
- Restartē serveri (notīra rate limit cache)

## Debug Commands

### Environment check
Browser console:
```javascript
console.log('Environment:', {
  NODE_ENV: process.env.NODE_ENV,
  SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...'
})
```

### Manual API test
```javascript
fetch('/api/products', {
  method: 'PUT',
  headers: {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'Origin': window.location.origin
  },
  body: JSON.stringify({
    id: 'your-product-id',
    name: 'Test Update'
  }),
  credentials: 'same-origin'
}).then(res => res.json()).then(console.log)
```

## Checklist pirms lūgšanas palīdzību

- [ ] Serveri restartēts ar jaunajiem .env mainīgajiem
- [ ] Browser console pārbaudīts error ziņojumiem
- [ ] Server console pārbaudīts debug ziņojumiem  
- [ ] Network tab pārbaudīts request/response details
- [ ] Autentifikācija pārbaudīta (vai esi pieteicies kā admin)
- [ ] Database `profiles` tabula pārbaudīta (vai role = 'admin')
- [ ] Test utilities izmantoti (window.testAPI.*)

## Kontaktinformācija
Ja problēma joprojām pastāv, dalies ar:
1. Browser console error logs
2. Server console debug output  
3. Network tab screenshot no PUT request
4. Tavs user role database
