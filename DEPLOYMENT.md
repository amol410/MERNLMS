# DolphinCoder LMS - Hostinger Deployment Guide

## Prerequisites
- Hostinger VPS or Business Hosting with Node.js support
- MongoDB Atlas account (free tier works)
- Domain: dolphincoder.com

---

## Step 1: MongoDB Atlas Setup
1. Go to [mongodb.com/cloud/atlas](https://mongodb.com/cloud/atlas)
2. Create a free cluster
3. Add a database user (save username/password)
4. Whitelist all IPs: `0.0.0.0/0`
5. Copy your connection string: `mongodb+srv://user:pass@cluster.mongodb.net/dolphincoder_lms`

---

## Step 2: Deploy Backend to Hostinger

### Option A: Hostinger VPS
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

# Install dependencies
npm install --production

# Create .env
nano .env
```

### Backend `.env` (production)
```
PORT=5000
MONGODB_URI=mongodb+srv://YOUR_USER:YOUR_PASS@cluster.mongodb.net/dolphincoder_lms
JWT_SECRET=GENERATE_A_LONG_RANDOM_SECRET_KEY_HERE_AT_LEAST_64_CHARS
JWT_EXPIRE=7d
BCRYPT_ROUNDS=12
NODE_ENV=production
CLIENT_URL=https://dolphincoder.com
```

```bash
# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

### Nginx reverse proxy
```nginx
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

---

## Step 3: Deploy Frontend to Hostinger

```bash
# On your local machine
cd frontend

# Create production .env
echo "VITE_API_BASE_URL=https://api.dolphincoder.com/api" > .env

# Build
npm install
npm run build

# Upload dist/ folder to Hostinger file manager -> public_html
```

### Or via FTP/SSH:
```bash
scp -r dist/* root@your-vps:/var/www/html/
```

### Nginx for Frontend SPA
```nginx
server {
    listen 80;
    server_name dolphincoder.com www.dolphincoder.com;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Step 4: SSL (HTTPS)
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d dolphincoder.com -d www.dolphincoder.com -d api.dolphincoder.com
```

---

## Hostinger Shared Hosting (Alternative)
If using shared hosting with Node.js app support:
1. Set Node.js version to 18.x in hPanel
2. Set entry point to `backend/server.js`
3. Add environment variables in hPanel
4. Upload built frontend to public_html

---

## Environment Variables Summary

| Variable | Value |
|----------|-------|
| MONGODB_URI | Your Atlas connection string |
| JWT_SECRET | Random 64+ char string |
| CLIENT_URL | https://dolphincoder.com |
| VITE_API_BASE_URL | https://api.dolphincoder.com/api |
