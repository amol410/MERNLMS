# DolphinCoder LMS - Hostinger Deployment Guide

> Stack: **Node.js (Express) + MySQL + Sequelize**. The backend serves both the API
> (`/api/*`) and the built React SPA (`backend/dist`). One Node process handles
> everything; Nginx only reverse-proxies.

## Prerequisites
- Hostinger VPS with Node.js 18+
- MySQL 8 (Hostinger VPS package or remote MySQL from hPanel)
- Domains: `dolphincoder.com` (web app) and `api.dolphincoder.com` (API)

---

## Step 1: MySQL Database Setup

**On the VPS (self-managed):**
```bash
sudo mysql -u root -p
```
```sql
CREATE DATABASE dolphincoder_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lms_user'@'localhost' IDENTIFIED BY 'STRONG_PASSWORD_HERE';
GRANT ALL PRIVILEGES ON dolphincoder_lms.* TO 'lms_user'@'localhost';
FLUSH PRIVILEGES;
```

**Or via hPanel (Hostinger remote MySQL):** create a database + user, note the host,
and whitelist your VPS IP instead of `localhost`.

> Tables are created automatically on first boot — the app runs
> `sequelize.sync({ alter: true })` (temporary, see `fix.md`).

---

## Step 2: Deploy Backend + Web App

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2
npm install -g pm2

# Clone repo
git clone https://github.com/amol410/MERNLMS.git /var/www/lms
cd /var/www/lms/backend
npm install --production

# Create .env
nano .env
```

### Backend `.env` (production)
```
PORT=5000
DB_HOST=localhost
DB_USER=lms_user
DB_PASSWORD=STRONG_PASSWORD_HERE
DB_NAME=dolphincoder_lms
JWT_SECRET=<openssl rand -hex 32 — 64 hex chars>
JWT_EXPIRE=7d
BCRYPT_ROUNDS=12
NODE_ENV=production
CLIENT_URL=https://dolphincoder.com
```

### Build the web frontend
```bash
# Outputs to backend/dist — Express serves it as the SPA. Nothing to upload.
cd /var/www/lms/frontend
npm install
npm run build
```

### Start with PM2
```bash
cd /var/www/lms/backend
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

> ⚠ **Schema-changing deploys:** `ecosystem.config.js` runs PM2 in cluster mode
> (`instances: 'max'`). Because the app still uses `sync({ alter: true })`, every
> worker issues DDL on boot. After changing a Sequelize model, either start a single
> instance first (`pm2 delete lms && pm2 start server.js --name lms`, then scale back
> up) or follow the migration plan in `fix.md`.

---

## Step 3: Nginx Reverse Proxy

Both domains point at the same Node process — it serves the API and the SPA.

```nginx
# /etc/nginx/sites-available/dolphincoder-api
server {
    listen 80;
    server_name api.dolphincoder.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```nginx
# /etc/nginx/sites-available/dolphincoder-web
server {
    listen 80;
    server_name dolphincoder.com www.dolphincoder.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/dolphincoder-api /etc/nginx/sites-enabled/
sudo ln -s /etc/nginx/sites-available/dolphincoder-web /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

> **Optional optimization:** serve `/var/www/lms/backend/dist` directly from Nginx
> (`root` + `try_files $uri /index.html`) on the web domain and only `proxy_pass`
> `/api/` — offloads static files from Node. Both work; the proxy-everything setup
> above is the simplest.

---

## Step 4: SSL (HTTPS)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d dolphincoder.com -d www.dolphincoder.com -d api.dolphincoder.com
```

---

## Step 5: Verify
```bash
curl -i https://api.dolphincoder.com/api/auth/me        # expect 401 JSON, not HTML
curl -I https://dolphincoder.com                        # expect 200, text/html (SPA)
pm2 logs                                                # check for DB connection errors on boot
```
- API rate limits: 400 req/15min global, 100 req/15min on auth routes.
- Mobile app talks to `https://api.dolphincoder.com/api` (see
  `app/dolphincoder/lib/core/constants/api_constants.dart`).

---

## Hostinger Shared Hosting (Alternative)
If using shared hosting with Node.js app support:
1. Set Node.js version to 18.x in hPanel
2. Set entry point to `backend/server.js`
3. Add the environment variables from Step 2 in hPanel (use Hostinger remote MySQL)
4. The frontend is served by the same app — no public_html upload needed

---

## Environment Variables Summary

| Variable | Value |
|----------|-------|
| DB_HOST | `localhost` (or Hostinger remote MySQL host) |
| DB_USER / DB_PASSWORD / DB_NAME | MySQL credentials from Step 1 |
| JWT_SECRET | Random 64+ char string (`openssl rand -hex 32`) |
| CLIENT_URL | https://dolphincoder.com |
| NODE_ENV | production |

---

## ⚠ Security notes
- `backend/.env.example` previously contained real production credentials — if your
  deployment still uses that JWT secret or DB password, **rotate them** (they exist in
  git history) and never reuse values from that file.
- `backend/seedAdmin.js` / `fixAdmin.js` contain a hard-coded admin password — change
  the admin password after first login, or make those scripts read from env vars.
