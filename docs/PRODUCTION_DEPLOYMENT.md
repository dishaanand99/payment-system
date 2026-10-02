# Production Deployment & Infrastructure Hardening Guide

This document outlines the safe sequence for preparing, deploying, and maintaining the standalone NGO Donation Management & Payment Verification System. 

**WARNING: Do NOT blindly delete database files or run Prisma resets against the production environment.**

## 1. Production Architecture Overview
- **DNS / WAF**: Cloudflare (for edge-level rate-limiting and DDoS protection)
- **Reverse Proxy**: Nginx (handles SSL termination, enforces file protection on `/storage/`)
- **Application Server**: Node.js via PM2 (runs Next.js standalone build)
- **Database**: SQLite (local persistent file)
- **File Storage**: Local persistent directory (e.g. `storage/uploads/donations`)

## 2. Server Requirements & Process Management (PM2)
- Node.js version 18.x or 20.x
- **PM2** installed globally (`npm install -g pm2`)

**Start command:**
```bash
# After building, start the app with PM2:
pm2 start npm --name "ngo-donation-system" -- run start
pm2 save
pm2 startup
```

## 3. Environment Variables (.env)
Never commit the `.env` file to source control. Create a `.env` file at the root of the project using the structure found in `.env.example`.

```ini
# Database
DATABASE_URL="file:./dev.db"

# URLs & Secrets
NEXT_PUBLIC_APP_URL="https://admin.example.org"
SESSION_SECRET="GENERATE_A_64_CHAR_RANDOM_STRING"

# PayU Credentials
PAYU_MERCHANT_KEY="YOUR_PROD_KEY"
PAYU_MERCHANT_SALT="YOUR_PROD_SALT"
PAYU_ENVIRONMENT="production"

# API Integration
NGO_WEBSITE_ORIGIN="https://www.example.org"
NGO_API_KEY="SECURE_API_TOKEN"

# Storage
UPLOAD_STORAGE_PATH="./storage/uploads/donations"
```

## 4. SQLite Production Strategy & Backups
SQLite is used for this application. Ensure the database file (`dev.db`) is outside the ephemeral `.next` or `node_modules` folders to avoid accidental deletion.

**Automated Backup Strategy:**
Set up a daily cron job to securely copy the SQLite file to an external bucket (like AWS S3) or a separate secure disk.
```bash
# Backup Cron Example (runs daily at 2:00 AM)
0 2 * * * cp /path/to/app/dev.db /path/to/backups/dev_$(date +\%F).db
```
**Database Migrations:**
In production, run additive migrations only. NEVER run `prisma migrate reset`.
```bash
npx prisma migrate deploy
npx prisma generate
```

## 5. Upload Storage & Privacy
Screenshots are securely stored via `UPLOAD_STORAGE_PATH`. Nginx must never expose this folder publicly.

Verify directory permissions:
```bash
mkdir -p ./storage/uploads/donations
chmod -R 700 ./storage/
```

## 6. Nginx Reverse Proxy Configuration
Configure Nginx to proxy traffic to Node (typically port 3000) while enforcing HTTPS and blocking access to the internal storage path.

```nginx
server {
    listen 80;
    server_name admin.example.org;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name admin.example.org;

    ssl_certificate /etc/letsencrypt/live/admin.example.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admin.example.org/privkey.pem;

    # Rate Limiting Zones (requires configuration in nginx.conf)
    # limit_req zone=api burst=10 nodelay;

    # Block public access to uploaded files
    location ^~ /storage/ {
        deny all;
        return 404;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## 7. Rate Limiting & SSL
- **SSL**: Issue a certificate using Certbot: `certbot --nginx -d admin.example.org`.
- **Rate Limiting**: Apply Cloudflare rules or Nginx `limit_req` explicitly on `/api/public/donations` to prevent spam API calls. Do not aggressively block the PayU webhook at `/api/payu/webhook`.

## 8. Deployment Sequence
1. Pull the latest code.
2. Ensure `.env` is populated correctly.
3. Run `npm ci` (clean install).
4. Run `npx prisma generate` and `npx prisma migrate deploy`.
5. Run `npm run build`.
6. Restart the app: `pm2 reload ngo-donation-system`.

## 9. Rollback Strategy
**Application Rollback:** 
If a build fails, revert the Git commit to the previous stable version, run `npm ci`, `npm run build`, and `pm2 reload ngo-donation-system`.

**Database Rollback:** 
Never drop tables to roll back. If an emergency DB restore is needed:
1. Stop the application: `pm2 stop ngo-donation-system`.
2. Move the corrupted DB: `mv dev.db dev.corrupt.db`.
3. Copy the latest backup: `cp /backups/dev_yesterday.db ./dev.db`.
4. Start the application: `pm2 start ngo-donation-system`.

## 10. Health & Security Checks
- **Health Check**: Accessible at `GET /api/health`.
- **Headers**: Controlled by `next.config.ts` enforcing `X-Frame-Options: DENY`, `Strict-Transport-Security`, and `X-Content-Type-Options: nosniff`.
- **Cookie Security**: Next.js automatically sets `HttpOnly` and `Secure` attributes for session cookies in production mode (`NODE_ENV=production`).
