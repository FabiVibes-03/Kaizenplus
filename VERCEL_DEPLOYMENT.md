# Vercel Deployment Guide - Kaizen+ Backend

## 🚀 Despliegue en Vercel (Serverless)

Vercel es ideal para el backend de Kaizen+ porque:
- ✅ Serverless automático (escala según demanda)
- ✅ Deploy con Git (push = deploy automático)
- ✅ Variables de entorno seguras
- ✅ HTTPS gratis
- ✅ Mejor para Next.js + API

## 📋 Pasos de Despliegue

### 1. Preparar el Repositorio Git

```bash
# Si no tienes git inicializado
git init
git add .
git commit -m "Initial commit - Kaizen+"

# Sube a GitHub/GitLab
git remote add origin https://github.com/TU_USUARIO/kaizen-plus.git
git push -u origin main
```

### 2. Conectar con Vercel

1. Ve a [vercel.com](https://vercel.com) y crea una cuenta
2. Click en **"Add New Project"**
3. Importa tu repositorio de GitHub
4. Vercel detectará automáticamente Next.js

### 3. Configurar Variables de Entorno

En el dashboard de Vercel → Settings → Environment Variables, agrega:

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
```

### 4. Deploy

```bash
# Instala Vercel CLI (opcional, para deploy desde terminal)
npm install -g vercel

# Deploy
vercel

# O simplemente haz push a GitHub y Vercel despliega automáticamente
git push
```

## 🔧 Configuración Actual

✅ **vercel.json** creado - Configura el backend como serverless
✅ **Backend compatible** - Express funciona en Vercel
✅ **Rutas API** - Todas bajo `/api/*`

## 🌐 URLs Finales

Después del deploy:
- **Frontend:** `https://kaizen-plus.vercel.app`
- **Backend API:** `https://kaizen-plus.vercel.app/api`

## 📱 Actualizar Mobile App

Después del deploy, actualiza `mobile/services/api.js`:
```javascript
const API_URL = 'https://kaizen-plus.vercel.app/api';
```

## ⚠️ Notas Importantes

1. **Base de Datos:** Asegúrate de whitelist la IP de Vercel en Hostinger
   - Vercel usa IPs dinámicas, considera usar `0.0.0.0/0` (todos) o migrar a una DB serverless como PlanetScale

2. **Conexiones MySQL:** Vercel tiene límite de conexiones. El pool está configurado para 5 conexiones máximo.

3. **Cold Starts:** La primera request puede tardar ~1-2 segundos (normal en serverless)

## 🔄 Actualizaciones Futuras

Cada vez que hagas `git push`, Vercel despliega automáticamente:
```bash
git add .
git commit -m "Update features"
git push
```

## 🐛 Troubleshooting

### Error: "Database connection failed"
- Verifica que las variables de entorno estén configuradas en Vercel
- Whitelist las IPs de Vercel en Hostinger Remote MySQL

### Error: "Module not found"
- Asegúrate de que todas las dependencias estén en `package.json`
- Vercel instala automáticamente con `npm install`

---

**¡Listo para producción!** 🎉
