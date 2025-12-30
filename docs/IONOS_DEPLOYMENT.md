# IONOS VPS Deployment Guide

**Version:** 1.0
**Last Updated:** December 30, 2025
**Target Platform:** IONOS VPS with Ubuntu 22.04 LTS

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Server Specifications](#server-specifications)
3. [Initial Server Setup](#initial-server-setup)
4. [Installing Dependencies](#installing-dependencies)
5. [Installing Ollama & Digital Muse](#installing-ollama--digital-muse)
6. [Database Setup](#database-setup)
7. [Application Deployment](#application-deployment)
8. [SSL/TLS Configuration](#ssltls-configuration)
9. [Monitoring & Maintenance](#monitoring--maintenance)
10. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Required Access
- [ ] IONOS account with VPS access
- [ ] Root or sudo access to the VPS
- [ ] Domain name configured (e.g., collabhub.ai)
- [ ] SSH key pair generated

### Required Credentials
- [ ] GitHub repository access token
- [ ] API keys for cloud LLM providers (Anthropic, OpenAI, etc.)
- [ ] PostgreSQL password (generate secure password)
- [ ] JWT secret (generate secure random string)

---

## Server Specifications

### Minimum Requirements (Digital Muse Lite - 7B)

| Component | Specification |
|-----------|---------------|
| **CPU** | 8 cores |
| **RAM** | 16 GB |
| **Storage** | 200 GB SSD |
| **GPU** | Optional (CPU inference acceptable) |
| **Bandwidth** | 100 Mbps |

**Estimated Cost:** €30-50/month
**Performance:** Adequate for development and small teams (<10 users)

### Recommended (Digital Muse Standard - 32B)

| Component | Specification |
|-----------|---------------|
| **CPU** | 16 cores |
| **RAM** | 64 GB |
| **Storage** | 500 GB NVMe SSD |
| **GPU** | NVIDIA RTX 4090 (24GB VRAM) |
| **Bandwidth** | 1 Gbps |

**Estimated Cost:** €150-250/month
**Performance:** Production-ready for medium teams (<100 users)

### Enterprise (Digital Muse Pro - 70B)

| Component | Specification |
|-----------|---------------|
| **CPU** | 32+ cores |
| **RAM** | 128 GB |
| **Storage** | 1 TB NVMe SSD |
| **GPU** | NVIDIA A100 (80GB VRAM) or 2x RTX 4090 |
| **Bandwidth** | 10 Gbps |

**Estimated Cost:** €500-1000/month
**Performance:** Enterprise-scale (500+ users)

---

## Initial Server Setup

### Step 1: Access Your IONOS VPS

```bash
# Connect via SSH (replace with your server IP)
ssh root@YOUR_VPS_IP

# Update system packages
apt update && apt upgrade -y

# Set timezone
timedatectl set-timezone America/Chicago  # Adjust for your region

# Set hostname
hostnamectl set-hostname collabhub-ai
```

### Step 2: Create Non-Root User

```bash
# Create deployment user
adduser collabhub
usermod -aG sudo collabhub

# Setup SSH key authentication
mkdir -p /home/collabhub/.ssh
cp ~/.ssh/authorized_keys /home/collabhub/.ssh/
chown -R collabhub:collabhub /home/collabhub/.ssh
chmod 700 /home/collabhub/.ssh
chmod 600 /home/collabhub/.ssh/authorized_keys

# Switch to new user
su - collabhub
```

### Step 3: Configure Firewall

```bash
# Enable UFW firewall
sudo ufw allow OpenSSH
sudo ufw allow 80/tcp      # HTTP
sudo ufw allow 443/tcp     # HTTPS
sudo ufw allow 5432/tcp    # PostgreSQL (optional, for external access)
sudo ufw enable

# Verify status
sudo ufw status
```

---

## Installing Dependencies

### Step 1: Install Docker & Docker Compose

```bash
# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add user to docker group
sudo usermod -aG docker collabhub

# Log out and back in for group changes to take effect
exit
su - collabhub

# Verify Docker installation
docker --version
docker compose version
```

### Step 2: Install NVIDIA Drivers (If GPU Present)

```bash
# Check if NVIDIA GPU is present
lspci | grep -i nvidia

# Install NVIDIA drivers
sudo apt install -y ubuntu-drivers-common
sudo ubuntu-drivers autoinstall

# Reboot to load drivers
sudo reboot

# After reboot, verify installation
nvidia-smi
```

### Step 3: Install NVIDIA Container Toolkit

```bash
# Add NVIDIA repository
distribution=$(. /etc/os-release;echo $ID$VERSION_ID)
curl -s -L https://nvidia.github.io/nvidia-docker/gpgkey | sudo apt-key add -
curl -s -L https://nvidia.github.io/nvidia-docker/$distribution/nvidia-docker.list | \
  sudo tee /etc/apt/sources.list.d/nvidia-docker.list

# Install nvidia-docker2
sudo apt update
sudo apt install -y nvidia-docker2

# Restart Docker
sudo systemctl restart docker

# Test GPU access in Docker
docker run --rm --gpus all nvidia/cuda:11.8.0-base-ubuntu22.04 nvidia-smi
```

### Step 4: Install Node.js (for local development/debugging)

```bash
# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

---

## Installing Ollama & Digital Muse

### Step 1: Install Ollama

```bash
# Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# Verify installation
ollama --version

# Start Ollama service
sudo systemctl start ollama
sudo systemctl enable ollama

# Check service status
sudo systemctl status ollama
```

### Step 2: Configure Ollama for GPU

```bash
# Edit Ollama systemd service
sudo nano /etc/systemd/system/ollama.service

# Add GPU configuration (if using GPU):
[Service]
Environment="OLLAMA_HOST=0.0.0.0:11434"
Environment="OLLAMA_NUM_GPU=1"
Environment="OLLAMA_NUM_THREAD=16"
Environment="OLLAMA_NUM_PARALLEL=4"

# Reload systemd and restart
sudo systemctl daemon-reload
sudo systemctl restart ollama
```

### Step 3: Pull Llama 3.3 70B Model

```bash
# Pull the base model (this will take 30-60 minutes, ~40GB download)
ollama pull llama3.3:70b

# Or for smaller servers, use the 32B model:
# ollama pull llama3.3:32b

# Verify model is available
ollama list
```

### Step 4: Create Digital Muse Model

```bash
# Create modelfile
cat > ~/digital-muse-modelfile << 'EOF'
FROM llama3.3:70b

PARAMETER temperature 0.7
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER repeat_penalty 1.1
PARAMETER num_ctx 8192

SYSTEM """
You are Digital Muse, the core AI assistant for CollabHub AI. Your primary responsibilities:

1. **Query Triage**: Analyze incoming queries and classify them as simple, moderate, or complex
2. **Local Execution**: Handle simple queries entirely on your own (Q&A, code completion, summarization)
3. **Context Preparation**: Prepare and format context for cloud AI agents
4. **Response Synthesis**: Combine multiple AI agent responses into cohesive answers
5. **Code Analysis**: Perform initial code review before escalating to cloud experts

You are part of a hybrid local-cloud architecture. Be efficient, accurate, and know when to escalate to cloud specialists.
"""
EOF

# Create the model
ollama create digital-muse:latest -f ~/digital-muse-modelfile

# Test the model
ollama run digital-muse:latest "Hello, introduce yourself."
```

---

## Database Setup

### Step 1: Install PostgreSQL

```bash
# Install PostgreSQL 16
sudo apt install -y postgresql-16 postgresql-contrib-16

# Start and enable service
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Check status
sudo systemctl status postgresql
```

### Step 2: Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# Create database and user
CREATE DATABASE collabhub_ai;
CREATE USER collabhub_admin WITH ENCRYPTED PASSWORD 'YOUR_SECURE_PASSWORD';
GRANT ALL PRIVILEGES ON DATABASE collabhub_ai TO collabhub_admin;
\q

# Enable remote access (optional, for development)
sudo nano /etc/postgresql/16/main/postgresql.conf
# Uncomment and modify: listen_addresses = '*'

sudo nano /etc/postgresql/16/main/pg_hba.conf
# Add line: host    all             all             0.0.0.0/0               md5

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### Step 3: Install pgvector Extension (for semantic search)

```bash
# Install build dependencies
sudo apt install -y postgresql-server-dev-16 git build-essential

# Clone and build pgvector
cd /tmp
git clone https://github.com/pgvector/pgvector.git
cd pgvector
make
sudo make install

# Enable extension
sudo -u postgres psql -d collabhub_ai -c "CREATE EXTENSION vector;"
```

---

## Application Deployment

### Step 1: Clone Repository

```bash
# Create application directory
sudo mkdir -p /opt/collabhub-ai
sudo chown collabhub:collabhub /opt/collabhub-ai
cd /opt/collabhub-ai

# Clone from GitHub (use your token)
git clone https://github.com/whateverjustpickone/collabhub-ai.git .

# Or if private repository:
git clone https://<TOKEN>@github.com/whateverjustpickone/collabhub-ai.git .
```

### Step 2: Configure Environment Variables

```bash
# Create production environment file
cat > /opt/collabhub-ai/.env.production << 'EOF'
# Database
DATABASE_URL=postgresql://collabhub_admin:YOUR_SECURE_PASSWORD@localhost:5432/collabhub_ai

# Application
NODE_ENV=production
PORT=3001
JWT_SECRET=YOUR_JWT_SECRET_HERE

# Ollama
OLLAMA_HOST=http://localhost:11434
DIGITAL_MUSE_MODEL=digital-muse:latest

# Cloud LLM API Keys
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-proj-...
GOOGLE_API_KEY=...
PERPLEXITY_API_KEY=...
MISTRAL_API_KEY=...
XAI_API_KEY=...
DEEPSEEK_API_KEY=...
MANUS_API_KEY=...
META_API_KEY=...
COHERE_API_KEY=...
QWEN_API_KEY=...
INFLECTION_API_KEY=...

# GitHub Integration
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...

# Frontend
VITE_API_URL=https://api.yourdomain.com
EOF

# Secure the file
chmod 600 /opt/collabhub-ai/.env.production
```

### Step 3: Build and Deploy with Docker Compose

```bash
# Create production docker-compose file
cat > /opt/collabhub-ai/docker-compose.prod.yml << 'EOF'
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./nginx/ssl:/etc/nginx/ssl:ro
      - ./frontend/dist:/usr/share/nginx/html:ro
    depends_on:
      - backend
    restart: always

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    env_file:
      - .env.production
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - OLLAMA_HOST=http://host.docker.internal:11434
    extra_hosts:
      - "host.docker.internal:host-gateway"
    depends_on:
      - postgres
    restart: always
    deploy:
      resources:
        limits:
          cpus: '8'
          memory: 16G

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: collabhub_ai
      POSTGRES_USER: collabhub_admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

volumes:
  postgres_data:
EOF

# Build Docker images
docker compose -f docker-compose.prod.yml build

# Run database migrations
cd backend
npm install
npx prisma migrate deploy
cd ..

# Start services
docker compose -f docker-compose.prod.yml up -d

# Check status
docker compose -f docker-compose.prod.yml ps
```

### Step 4: Create Systemd Service for Ollama Integration

```bash
# Ensure Ollama is accessible to Docker containers
# Test connection
curl http://localhost:11434/api/version

# Should return: {"version":"0.x.x"}
```

---

## SSL/TLS Configuration

### Step 1: Install Certbot

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Stop nginx if running
docker compose -f docker-compose.prod.yml stop nginx
```

### Step 2: Obtain SSL Certificate

```bash
# Request certificate (replace with your domain)
sudo certbot certonly --standalone -d yourdomain.com -d www.yourdomain.com

# Certificates will be saved to:
# /etc/letsencrypt/live/yourdomain.com/fullchain.pem
# /etc/letsencrypt/live/yourdomain.com/privkey.pem
```

### Step 3: Configure Nginx with SSL

```bash
# Create nginx configuration directory
mkdir -p /opt/collabhub-ai/nginx/ssl

# Copy certificates
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/collabhub-ai/nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/collabhub-ai/nginx/ssl/
sudo chown -R collabhub:collabhub /opt/collabhub-ai/nginx/ssl

# Create Nginx config
cat > /opt/collabhub-ai/nginx/nginx.conf << 'EOF'
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:3001;
    }

    # Redirect HTTP to HTTPS
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name yourdomain.com www.yourdomain.com;

        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;

        # Frontend
        location / {
            root /usr/share/nginx/html;
            try_files $uri $uri/ /index.html;
        }

        # Backend API
        location /api/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket support
        location /ws/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "Upgrade";
            proxy_set_header Host $host;
        }
    }
}
EOF

# Restart nginx
docker compose -f docker-compose.prod.yml up -d nginx
```

### Step 4: Setup Auto-Renewal

```bash
# Test renewal
sudo certbot renew --dry-run

# Create renewal hook
sudo nano /etc/letsencrypt/renewal-hooks/deploy/update-docker.sh

# Add content:
#!/bin/bash
cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem /opt/collabhub-ai/nginx/ssl/
cp /etc/letsencrypt/live/yourdomain.com/privkey.pem /opt/collabhub-ai/nginx/ssl/
chown -R collabhub:collabhub /opt/collabhub-ai/nginx/ssl
cd /opt/collabhub-ai
docker compose -f docker-compose.prod.yml restart nginx

# Make executable
sudo chmod +x /etc/letsencrypt/renewal-hooks/deploy/update-docker.sh
```

---

## Monitoring & Maintenance

### Step 1: Install Monitoring Tools

```bash
# Install Prometheus and Grafana
docker run -d \
  --name prometheus \
  -p 9090:9090 \
  -v /opt/monitoring/prometheus.yml:/etc/prometheus/prometheus.yml \
  prom/prometheus

docker run -d \
  --name grafana \
  -p 3000:3000 \
  grafana/grafana
```

### Step 2: Setup Log Rotation

```bash
# Configure Docker log rotation
cat > /etc/docker/daemon.json << 'EOF'
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

# Restart Docker
sudo systemctl restart docker
```

### Step 3: Create Backup Script

```bash
# Create backup script
cat > /opt/collabhub-ai/backup.sh << 'EOF'
#!/bin/bash

BACKUP_DIR="/opt/backups/collabhub-ai"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup database
docker exec collabhub-ai-postgres-1 pg_dump -U collabhub_admin collabhub_ai | \
  gzip > $BACKUP_DIR/db_backup_$DATE.sql.gz

# Backup environment file
cp /opt/collabhub-ai/.env.production $BACKUP_DIR/env_backup_$DATE

# Remove backups older than 7 days
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
EOF

# Make executable
chmod +x /opt/collabhub-ai/backup.sh

# Add to crontab (daily at 2 AM)
(crontab -l 2>/dev/null; echo "0 2 * * * /opt/collabhub-ai/backup.sh") | crontab -
```

### Step 4: Health Check Script

```bash
# Create health check script
cat > /opt/collabhub-ai/health-check.sh << 'EOF'
#!/bin/bash

# Check Ollama
if ! curl -s http://localhost:11434/api/version > /dev/null; then
    echo "Ollama is down! Restarting..."
    sudo systemctl restart ollama
fi

# Check Docker containers
if [ $(docker compose -f /opt/collabhub-ai/docker-compose.prod.yml ps | grep -c "Up") -lt 3 ]; then
    echo "Some containers are down! Restarting..."
    cd /opt/collabhub-ai
    docker compose -f docker-compose.prod.yml up -d
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 85 ]; then
    echo "WARNING: Disk usage is at ${DISK_USAGE}%"
fi
EOF

chmod +x /opt/collabhub-ai/health-check.sh

# Run every 5 minutes
(crontab -l 2>/dev/null; echo "*/5 * * * * /opt/collabhub-ai/health-check.sh") | crontab -
```

---

## Troubleshooting

### Issue: Ollama Not Accessible from Docker

**Solution:**
```bash
# Use host network mode or host.docker.internal
# In docker-compose.prod.yml:
extra_hosts:
  - "host.docker.internal:host-gateway"

# Set OLLAMA_HOST=http://host.docker.internal:11434
```

### Issue: Out of Memory During Inference

**Solution:**
```bash
# Switch to smaller model
ollama pull llama3.3:32b
# Update digital-muse modelfile to use 32b base

# Or reduce context window
# In modelfile: PARAMETER num_ctx 4096
```

### Issue: Slow Model Loading

**Solution:**
```bash
# Enable model preloading
ollama run digital-muse:latest "warmup"

# Keep model loaded
# In Ollama config: OLLAMA_KEEP_ALIVE=-1
```

### Issue: SSL Certificate Renewal Fails

**Solution:**
```bash
# Stop nginx temporarily
docker compose -f docker-compose.prod.yml stop nginx

# Manually renew
sudo certbot renew

# Restart nginx
docker compose -f docker-compose.prod.yml start nginx
```

### Issue: High API Costs

**Solution:**
```bash
# Check routing metrics
docker compose -f docker-compose.prod.yml logs backend | grep "routing_strategy"

# Adjust triage thresholds in backend/src/services/routing/intelligent-router.service.ts
# Aim for >70% local routing
```

---

## Updating the Application

```bash
# Navigate to application directory
cd /opt/collabhub-ai

# Pull latest changes
git pull origin main

# Rebuild and restart
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml down
docker compose -f docker-compose.prod.yml up -d

# Run migrations if needed
docker compose -f docker-compose.prod.yml exec backend npx prisma migrate deploy
```

---

## Performance Tuning Checklist

- [ ] Ollama using GPU acceleration (check with `nvidia-smi`)
- [ ] Appropriate model size for hardware (7B/32B/70B)
- [ ] Context window optimized (4096-8192 tokens)
- [ ] Docker resource limits configured
- [ ] PostgreSQL tuned for workload
- [ ] Nginx caching enabled
- [ ] Log rotation configured
- [ ] Backups running daily
- [ ] Health checks every 5 minutes
- [ ] SSL certificates auto-renewing
- [ ] Monitoring dashboards active

---

## Support Contacts

**Technical Issues:**
- GitHub Issues: https://github.com/whateverjustpickone/collabhub-ai/issues
- Email: support@collabhub.ai

**IONOS VPS Support:**
- Portal: https://my.ionos.com
- Phone: See IONOS support page

---

**End of IONOS Deployment Guide**

**Last Updated:** December 30, 2025
**Next Review:** March 30, 2026
