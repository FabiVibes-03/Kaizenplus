# Kaizen+ Deployment & Testing Guide

This guide covers how to run the application in **Local Testing** mode, **Production** mode, and **Hybrid** mode.

---

# � Hybrid Mode: Local App + Remote Database

**Yes! You can run the app on your PC but save data to the real Hostinger database.**

1.  **Whitelist your IP:**
    *   Log in to Hostinger -> Databases -> **Remote MySQL**.
    *   Add your public IP address (Google "what is my ip").
    *   *Note: If your internet IP changes, you will need to update this.*

2.  **Update Local Configuration:**
    *   Open `backend/.env` on your PC.
    *   Change `DB_HOST` from `localhost` to your Hostinger IP (e.g., `82.197.82.176`).
    *   Ensure `DB_USER` and `DB_PASSWORD` matches the Hostinger database user.

3.  **Run Normally:**
    *   `npm start` in backend.
    *   `npm run dev` in web.
    *   The app will feel local, but all data is saved to the cloud! ☁️

---

# 🛠️ Part 1: Local Testing (All Local)

Use this mode to develop offline or without affecting production data.

## Prerequisites
- Node.js (v18+) installed.
- MySQL Server installed locally.
- Expo Go app installed on your phone.

## 1. Database Setup
1.  Create a local database named `todokaizen`.
2.  Import `backend/database/schema.sql`.
3.  Update `backend/.env`: `DB_HOST=localhost`.

## 2. Running the App
```powershell
# Backend
cd backend && npm start

# Web
cd web && npm run dev

# Mobile
cd mobile && npx expo start
```

---

# 🚀 Part 2: Production Deployment (Hostinger)

Use this mode to go live.

## 1. Database (MySQL)
1.  Create a new database in Hostinger (e.g., `u720809890_TodoPlus`).
2.  Import `backend/database/schema.sql` via phpMyAdmin.

## 2. Backend (Node.js)
1.  **Zip** the `backend` folder (exclude `node_modules`).
2.  **Upload** to Hostinger **Files** (e.g., `backend_app` folder).
3.  **Create Node.js App** in Hostinger Panel:
    *   Root: `backend_app`
    *   Startup: `server.js`
4.  **Environment Variables:**
    *   `DB_HOST`: `localhost` (Internal IP)
    *   `DB_USER`: `u720809890_FabiVibes03`
    *   `JWT_SECRET`: (Your Secret)
5.  **Install & Restart:** Click NPM Install, then Restart.

## 3. Frontend Web (Next.js Static Export)
1.  **Build:**
    ```powershell
    cd web
    npm run build
    ```
    *(Ensure `next.config.mjs` has `output: 'export'`)*.
2.  **Upload:**
    *   Copy contents of `web/out` to Hostinger `public_html`.
3.  **Routing:**
    *   Ensure `.htaccess` exists in `public_html` (see code in repo for content).

## 4. Mobile App (APK Build)
1.  **Configure API:** `mobile/services/api.js` -> `https://api.yourdomain.com/api`
2.  **Build:** `eas build --profile production --platform android`
