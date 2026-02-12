# 🚀 Kaizen+ - Guía Rápida de Despliegue

## Opciones de Despliegue

### 🟢 Opción 1: Vercel (Recomendado - Más Fácil)

**Ventajas:**
- ✅ Deploy automático con Git
- ✅ Serverless (escala automáticamente)
- ✅ HTTPS gratis
- ✅ Perfecto para Next.js
- ✅ Variables de entorno en dashboard

**Pasos:**
1. Sube tu código a GitHub
2. Conecta en [vercel.com](https://vercel.com)
3. Configura variables de entorno
4. ¡Deploy automático!

📖 **Guía completa:** `VERCEL_DEPLOYMENT.md`

---

### 🔵 Opción 2: Hostinger (Manual)

**Ventajas:**
- ✅ Control total del servidor
- ✅ Base de datos incluida
- ✅ Ideal si ya tienes hosting

**Archivos listos:**
- `deploy/public_html/` → Frontend
- `deploy/backend_app.zip` → Backend
- `deploy/README_DEPLOYMENT.md` → Instrucciones

📖 **Guía completa:** `docs/DEPLOYMENT.md`

---

## 📱 Mobile App (APK)

**Estado:** ✅ Configurado y listo

```bash
cd mobile
eas build --profile production --platform android
```

📖 **Guía completa:** `mobile/BUILD_APK_GUIDE.md`

---

## 🗄️ Base de Datos

**Ubicación:** Hostinger MySQL
- Host: `82.197.82.176`
- Database: `u720809890_TodoPlus`

**Archivos:**
- `backend/database/schema.sql` → Estructura
- `backend/database/seed.sql` → Datos de prueba

---

## 🔐 Credenciales de Prueba

Después de importar `seed.sql`:

- **Admin:** `admin@kaizen.com` / `123456`
- **Manager:** `alice@kaizen.com` / `123456`
- **Developer:** `charlie@kaizen.com` / `123456`

---

## ✅ Checklist Final

- [ ] Base de datos importada (schema.sql + seed.sql)
- [ ] Variables de entorno configuradas
- [ ] Frontend desplegado
- [ ] Backend desplegado
- [ ] Mobile APK generado
- [ ] Pruebas de login funcionando

---

**¿Dudas?** Revisa las guías detalladas en cada carpeta.
