# DolphinCoder LMS — Production Deployment Guide

> **Architecture:** A unified full-stack architecture running **Node.js (Express 4) + MySQL 8 + Sequelize 6**.
> The single backend process serves both the REST API (`/api/*`), binary audio streams (`/api/notes/audio/db/:id`),
> and the built React Single Page Application (`backend/dist`). Nginx acts as a high-performance reverse proxy with SSL termination.

---

## 📋 Prerequisites
- **Hostinger VPS** (Ubuntu 22.04 / Debian 12 recommended) or Hostinger Shared Hosting with Node.js support.
- **Node.js**: v18.x or v20.x LTS.
- **MySQL Server**: MySQL 8.0+ or Hostinger Managed Remote MySQL.
- **Domain Names**:
  - `dolphincoder.com` & `www.dolphincoder.com` (Web application and primary API routing)
  - `api.dolphincoder.com` (Dedicated mobile API endpoint)

---

## 🗄️ Step 1: MySQL Database Configuration

### 1.1 VPS Local MySQL Setup
```bash
sudo mysql -u root -p
```
```sql
CREATE DATABASE dolphincoder_lms CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'lms_user'@'localhost' IDENTIFIED BY 'YOUR_STRONG_PASSWORD';
GRANT ALL PRIVILEGES ON dolphincoder_lms.* TO 'lms_user'@'localhost';
FLUSH PRIVILEGES;
```

### 1.2 Critical MySQL Setting: `max_allowed_packet`
Because DolphinCoder stores uploaded MP3 audio buffers directly in the MySQL `karaoke_audios` table (`LONGBLOB`) for both **Karaoke Notes** and **Multi-Stage Curriculum Lessons** (dedicated word tracks and reference speech audio), you **must** configure MySQL's maximum packet size to at least **64M** (default is often 16M).
In `/etc/mysql/my.cnf` or `/etc/mysql/mysql.conf.d/mysqld.cnf`:
```ini
[mysqld]
max_allowed_packet = 64M
```
Then restart MySQL:
```bash
sudo systemctl restart mysql
```

### 1.3 Curriculum Seeding & Performance Indexes
To seed the LingoDolphy language tracks into `CurriculumLessons`, import the curriculum seed SQL files:
```bash
# German A1 (105 Units, 1,680 Lessons across 3 Sections)
mysql -u lms_user -p dolphincoder_lms < /var/www/lms/seed_german_a1.sql
# Or section-wise:
# mysql -u lms_user -p dolphincoder_lms < /var/www/lms/seed_german_a1_sec1.sql
# mysql -u lms_user -p dolphincoder_lms < /var/www/lms/seed_german_a1_sec2.sql
# mysql -u lms_user -p dolphincoder_lms < /var/www/lms/seed_german_a1_sec3.sql

# English A1 — Hindi Medium (35 Units, 560 Lessons)
mysql -u lms_user -p dolphincoder_lms < /var/www/lms/seed_english_a1_hindi.sql

# English A1 — Marathi Medium (35 Units, 560 Lessons)
mysql -u lms_user -p dolphincoder_lms < /var/www/lms/seed_english_a1_marathi.sql
```

Ensure the following composite indexes are active for sub-10ms JIT lesson lookups and archipelago path projections:
```sql
-- Curriculum lesson order lookup by course and unit
CREATE INDEX IF NOT EXISTS idx_curriculum_course_unit_order 
ON CurriculumLessons (course_id, unit_number, lesson_order);

-- User progress indexing for fast path status resolution
CREATE INDEX IF NOT EXISTS idx_user_node_progress_user_course 
ON UserNodeProgress (user_id, course_id, node_id);
```

---

## 🚀 Step 2: Deploy Backend & React SPA

```bash
# 1. SSH into the server
ssh root@your-vps-ip

# 2. Install Node.js 20 LTS & PM2
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
sudo npm install -g pm2

# 3. Clone repository into /var/www/lms
git clone https://github.com/amol410/MERNLMS.git /var/www/lms
cd /var/www/lms

# 4. Install backend dependencies
cd /var/www/lms/backend
npm install --production

# 5. Build the React frontend bundle
cd /var/www/lms/frontend
npm install
npm run build   # Compiles directly into /var/www/lms/backend/dist
```

### 2.1 Backend Production `.env`
Create `/var/www/lms/backend/.env`:
```env
PORT=5000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=dolphincoder_lms
DB_USER=lms_user
DB_PASSWORD=YOUR_STRONG_PASSWORD
JWT_SECRET=your_super_secret_key_minimum_64_characters_long
JWT_EXPIRE=7d
BCRYPT_ROUNDS=12
NODE_ENV=production
CLIENT_URL=https://dolphincoder.com
```

### 2.2 Start Application with PM2
Ensure `ecosystem.config.js` sets `--max-old-space-size=2048` to allocate sufficient memory for large curriculum queries and binary streams:
```javascript
module.exports = {
  apps: [{
    name: 'dolphincoder-backend',
    script: 'server.js',
    node_args: '--max-old-space-size=2048',
    instances: 'max',
    exec_mode: 'cluster',
    env_production: {
      NODE_ENV: 'production',
      PORT: 5000
    }
  }]
};
```
Start and persist the PM2 daemon:
```bash
cd /var/www/lms/backend
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

---

## 🌐 Step 3: Nginx Reverse Proxy Configuration

Nginx proxies requests to the Express server running on port 5000. It is configured to support HTTP Range requests (`Accept-Ranges: bytes`) for audio scrubbing and large file uploads.

### 3.1 Nginx Server Block (`/etc/nginx/sites-available/dolphincoder`)
```nginx
server {
    listen 80;
    server_name dolphincoder.com www.dolphincoder.com api.dolphincoder.com;

    # Allow up to 50MB audio and document uploads
    client_max_body_size 50M;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;

        # WebSocket & connection upgrade headers
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        # Forward real client IP and protocol
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # HTTP 206 Partial Content Range support for audio scrubbing
        proxy_set_header Range $http_range;
        proxy_set_header If-Range $http_if_range;
        proxy_buffering off;
    }
}
```

Enable the configuration:
```bash
sudo ln -s /etc/nginx/sites-available/dolphincoder /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔒 Step 4: SSL (HTTPS) with Let's Encrypt

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d dolphincoder.com -d www.dolphincoder.com -d api.dolphincoder.com
```

Certbot automatically schedules SSL renewals via systemd timers.

---

## 🩺 Step 5: Verification & Health Checks

```bash
# 1. Verify API health
curl -I https://dolphincoder.com/api/health
# Expected: HTTP/1.1 200 OK

# 2. Verify SPA index delivery
curl -I https://dolphincoder.com/
# Expected: HTTP/1.1 200 OK, Content-Type: text/html

# 3. Verify Audio 206 Range Stream
curl -I -H "Range: bytes=0-1024" https://dolphincoder.com/api/notes/audio/db/1
# Expected: HTTP/1.1 206 Partial Content, Content-Range: bytes 0-1024/...

# 4. Check PM2 cluster logs
pm2 logs
```

---

## 🔄 Step 6: Post-Deployment Updates

When updating code in production:
```bash
cd /var/www/lms
git pull origin master

# If frontend changed:
cd frontend
npm install
npm run build

# If backend changed:
cd ../backend
npm install --production
npm test               # Run in-band Jest & Supertest test suite before reloading
pm2 reload all --update-env
```

---

## 🧪 Step 7: Automated Test Verification & Live Hostinger Benchmarking

Run the backend verification test harness on the server or deployment pipeline:
```bash
cd /var/www/lms/backend

# 1. Run automated unit & integration test suite (in-band)
npm test

# 2. Run live Hostinger VPS latency benchmark test suite (30s timeout)
npm run test:live

# 3. Run standalone benchmark script with p50, p90, p99 latency percentiles
node scripts/benchmark_hostinger.js
```

---

## 📱 Step 8: Mobile Google Play Release Pipeline

When releasing an update for the Android mobile application:
```bash
cd /var/www/lms/app/dolphincoder # or local workstation

# 1. Fetch dependencies
flutter pub get

# 2. Run static analysis
flutter analyze

# 3. Build Google Play Release App Bundle (.aab)
flutter build appbundle --release

# The signed production bundle is output to:
# build/app/outputs/bundle/release/app-release.aab
```

Verify `app_version.json` matches the new build number before uploading to Google Play Console.

