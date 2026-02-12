# 🚀 Subir Variables de Entorno a Vercel

## Opción 1: Usando Vercel CLI (Más Rápido)

### 1. Instala Vercel CLI (si no lo tienes)
```bash
npm install -g vercel
```

### 2. Login en Vercel
```bash
vercel login
```

### 3. Link tu proyecto
```bash
vercel link
# Selecciona: FabiVibes-03 → Kaizenplus
```

### 4. Sube las variables de entorno
```bash
vercel env pull .env.vercel
vercel env add < .env.production
```

O una por una:
```bash
vercel env add DB_HOST production
# Pega: 82.197.82.176

vercel env add DB_USER production
# Pega: u720809890_FabiVibes03

vercel env add DB_PASSWORD production
# Pega: FabiVibes03.

vercel env add DB_NAME production
# Pega: u720809890_TodoPlus

vercel env add DB_PORT production
# Pega: 3306

vercel env add JWT_SECRET production
# Pega: kaizen_plus_secret_2026_change_in_production

vercel env add JWT_EXPIRES_IN production
# Pega: 7d

vercel env add JWT_REFRESH_EXPIRES_IN production
# Pega: 30d

vercel env add NODE_ENV production
# Pega: production

vercel env add PORT production
# Pega: 3000
```

### 5. Redeploy
```bash
vercel --prod
```

---

## Opción 2: Desde el Dashboard (Manual)

1. Ve a [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click en tu proyecto **Kaizenplus**
3. Settings → Environment Variables
4. Copia y pega cada variable del archivo `.env.production`

---

## ✅ Variables a Configurar (10 total)

```
DB_HOST=82.197.82.176
DB_USER=u720809890_FabiVibes03
DB_PASSWORD=FabiVibes03.
DB_NAME=u720809890_TodoPlus
DB_PORT=3306
JWT_SECRET=kaizen_plus_secret_2026_change_in_production
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d
NODE_ENV=production
PORT=3000
```

---

**Nota:** El archivo `.env.production` está en `.gitignore` por seguridad.
