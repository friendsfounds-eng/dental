# 🚀 Apex Dental Clinic ERP - Production Hosting & Deployment Guide

This guide provides step-by-step instructions to deploy and host the **Apex Dental Clinic Management ERP & Odontogram System** across cloud platforms, VPS servers, Docker containers, or local clinic networks.

---

## 📋 Table of Contents
1. [Architecture Overview](#-architecture-overview)
2. [Prerequisites & Environment Variables](#-prerequisites--environment-variables)
3. [Option 1: 1-Click Cloud Hosting (Render / Railway)](#-option-1-1-click-cloud-hosting-render--railway)
4. [Option 2: Docker & Docker Compose (Recommended for Any VPS)](#-option-2-docker--docker-compose-recommended-for-any-vps)
5. [Option 3: Ubuntu / Debian Linux VPS (PM2 + Nginx + SSL)](#-option-3-ubuntu--debian-linux-vps-pm2--nginx--ssl)
6. [Option 4: Windows Server or Local Clinic Network (LAN)](#-option-4-windows-server-or-local-clinic-network-lan)
7. [Backup & Data Retention](#-backup--data-retention)
8. [Health Check & Verification](#-health-check--verification)

---

## 🏛 Architecture Overview

In production mode:
- The React + Vite frontend is pre-compiled into static assets (`client/dist/`).
- The Express server (`server/server.js`) serves both the REST API (`/api/*`) and the frontend single-page application from a single port (`PORT`, default `5000`).
- No separate frontend web server is required.
- Medical vaults, clinic records, and tenant data are stored in `server/data/`.

---

## ⚙ Prerequisites & Environment Variables

Copy `.env.example` to `.env` or set these environment variables in your hosting dashboard:

| Variable | Required | Default | Description |
| :--- | :---: | :---: | :--- |
| `PORT` | Optional | `5000` | Port on which the HTTP server listens (auto-detected on Render/Railway/Heroku). |
| `HOST` | Optional | `0.0.0.0` | Network interface to bind. `0.0.0.0` allows external cloud traffic. |
| `NODE_ENV` | Optional | `production` | Set to `production` for production mode. |
| `CLINIC_VAULT_ENCRYPTION_KEY` | Recommended | Auto-generated | 32+ character random key for AES-256 patient DICOM & X-ray encryption. |
| `AWS_S3_BUCKET` | Optional | `null` | AWS S3 Bucket name if offloading scans to AWS S3. |
| `AWS_REGION` | Optional | `ap-south-1` | AWS S3 region. |
| `AWS_ACCESS_KEY_ID` | Optional | `null` | AWS S3 Access Key. |
| `AWS_SECRET_ACCESS_KEY` | Optional | `null` | AWS S3 Secret Access Key. |

---

## ☁ Option 1: 1-Click Cloud Hosting (Render / Railway)

### Deploying to Render.com
1. Create a free account at [render.com](https://render.com).
2. Connect your GitHub/GitLab repository.
3. Click **New +** > **Web Service**.
4. Configure the settings:
   - **Environment**: `Node`
   - **Build Command**: `npm run build`
   - **Start Command**: `npm start`
   - **Health Check Path**: `/health`
5. (Optional) Under **Disks**, add a persistent disk mounted at `/opt/render/project/src/server/data` so clinic records persist across redeploys.
6. Click **Deploy**. Your clinic system will be live on `https://your-app.onrender.com`.

*(Alternatively, use `render.yaml` which automatically configures these settings via Render Blueprints).*

### Deploying to Railway.app
1. Go to [railway.app](https://railway.app) and create a project from your GitHub repo.
2. Railway detects the `Dockerfile` automatically.
3. Under **Volumes**, mount a volume to `/app/server/data`.
4. Deploy! Railway provides a public HTTPS domain.

---

## 🐳 Option 2: Docker & Docker Compose (Recommended for Any VPS)

Use this method on any Linux VPS (DigitalOcean, Hetzner, AWS EC2, Linode, Contabo) with Docker installed.

### Step 1: Clone the repository
```bash
git clone https://github.com/your-clinic/dental-erp.git /opt/dental-erp
cd /opt/dental-erp
```

### Step 2: Configure Environment
```bash
cp .env.example .env
nano .env # Set your CLINIC_VAULT_ENCRYPTION_KEY
```

### Step 3: Launch with Docker Compose
```bash
docker compose up -d --build
```

### Step 4: Verify Status
```bash
docker compose ps
docker compose logs -f
```
The application will be running at `http://YOUR_SERVER_IP:5000`.

---

## 🐧 Option 3: Ubuntu / Debian Linux VPS (PM2 + Nginx + SSL)

### Step 1: Install Node.js (v20) and Nginx
```bash
# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs nginx

# Install PM2 process manager globally
sudo npm install -g pm2
```

### Step 2: Deploy Code & Build Assets
```bash
cd /var/www/dental-erp
npm install
npm run build
```

### Step 3: Start with PM2
```bash
# Start server with production configuration
pm2 start ecosystem.config.cjs --env production

# Ensure PM2 starts automatically on server reboot
pm2 save
pm2 startup
```

### Step 4: Configure Nginx Reverse Proxy
Copy the provided `nginx.conf`:
```bash
sudo cp nginx.conf /etc/nginx/sites-available/dental-erp
sudo nano /etc/nginx/sites-available/dental-erp # Edit server_name to your domain

sudo ln -s /etc/nginx/sites-available/dental-erp /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### Step 5: Secure with Free SSL (Let's Encrypt Certbot)
```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d clinic.yourdomain.com
```

---

## 💻 Option 4: Windows Server or Local Clinic Network (LAN)

If running inside the clinic on a dedicated reception PC or local Windows Server:

1. Install **Node.js LTS (v20+)** from [nodejs.org](https://nodejs.org/).
2. Run `npm run build` once to build production frontend assets.
3. Double-click `start-production.bat`.
4. The server starts at `http://localhost:5000`.
5. **Access from other clinic PCs on the same Wi-Fi / LAN:**
   - Find the host PC's IP address by opening `cmd` and running `ipconfig` (e.g. `192.168.1.100`).
   - Allow Port 5000 in Windows Firewall:
     ```cmd
     netsh advfirewall firewall add rule name="Dental ERP Port 5000" dir=in action=allow protocol=TCP localport=5000
     ```
   - Open browser on any tablet or doctor PC on the clinic network: `http://192.168.1.100:5000`.

---

## 💾 Backup & Data Retention

All clinic data, appointments, invoices, accounting ledgers, and encrypted medical vaults reside in:
```
server/data/
```
To back up:
- **Docker:** Back up the `dental_data` docker volume.
- **VPS / Local:** Periodically archive `server/data/` (e.g. daily cron job syncing to Google Drive, AWS S3, or external USB disk).

---

## 🩺 Health Check & Verification

Once deployed, test that the system is running healthy:

```bash
curl http://YOUR_HOST:5000/health
```

Expected JSON response:
```json
{
  "status": "ok",
  "uptime": 128,
  "timestamp": "2026-10-24T18:30:00.000Z",
  "service": "apex-dental-clinic-erp"
}
```

---
*Apex Dental Technologies — Clinical Practice & Multi-Tenant Dental ERP System*
