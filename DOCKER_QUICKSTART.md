# CollabHub AI - Docker Quick Start Guide

**Version**: 2.0.0
**Purpose**: Get CollabHub AI running in under 10 minutes

---

## Prerequisites

### Required Software
- **Docker Desktop** (for Windows)
  - Download: https://www.docker.com/products/docker-desktop
  - Version: 24.0+ recommended
  - Verify: `docker --version` and `docker-compose --version`

### API Keys Required
You'll need API keys from:
- ✅ Anthropic (Claude)
- ✅ OpenAI (ChatGPT)
- ✅ Google AI (Gemini)
- ✅ Perplexity
- ✅ DeepSeek
- ✅ xAI (Grok)
- ✅ Manus (if applicable)
- ✅ D-ID (avatars)
- ✅ ElevenLabs (voice)

---

## Quick Start (3 Steps)

### Step 1: Configure Environment Variables

1. Navigate to the collabhub-ai directory:
```bash
cd "C:\Users\990Win7Pro64\Documents\DigitalMuse_Studio\collabhub-ai"
```

2. Copy the example environment file:
```bash
copy .env.example .env
```

3. Edit `.env` file and add your API keys:
```bash
notepad .env
```

Replace all `your-xxx-api-key-here` values with your actual API keys.

### Step 2: Start Docker Services

Open PowerShell or Command Prompt in the `collabhub-ai` directory and run:

```bash
docker-compose up -d
```

This will:
- ✅ Download and start PostgreSQL database
- ✅ Download and start Redis
- ✅ Build and start the backend API
- ✅ Build and start the frontend UI

**First run takes 5-10 minutes** (downloads Docker images and builds containers)

### Step 3: Initialize Database

Run Prisma migrations to create database tables:

```bash
docker-compose exec backend npx prisma migrate dev --name init
```

---

## Verify Installation

### Check All Services Are Running

```bash
docker-compose ps
```

You should see 4 services running:
- ✅ `collabhub-postgres` (port 5432)
- ✅ `collabhub-redis` (port 6379)
- ✅ `collabhub-backend` (port 3001)
- ✅ `collabhub-frontend` (port 5173)

### Test Frontend

Open browser: http://localhost:5173

You should see the CollabHub AI interface.

### Test Backend API

Open browser: http://localhost:3001/health

You should see: `{"status":"ok","timestamp":"..."}`

---

## Common Commands

### Start Services
```bash
docker-compose up -d
```

### Stop Services
```bash
docker-compose down
```

### View Logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

### Restart a Service
```bash
docker-compose restart backend
docker-compose restart frontend
```

### Rebuild After Code Changes
```bash
# Rebuild specific service
docker-compose up -d --build backend

# Rebuild all
docker-compose up -d --build
```

### Access Database
```bash
# Open Prisma Studio (database GUI)
docker-compose exec backend npx prisma studio
```

Browser opens at: http://localhost:5555

### Run Database Migrations
```bash
docker-compose exec backend npx prisma migrate dev
```

### Seed Database with Test Data
```bash
docker-compose exec backend npm run prisma:seed
```

---

## Troubleshooting

### Port Already in Use

If you get "port already in use" errors:

**PostgreSQL (5432)**:
```bash
# Find process using port
netstat -ano | findstr :5432

# Kill process (replace PID with actual process ID)
taskkill /PID <PID> /F
```

**Redis (6379)**, **Backend (3001)**, **Frontend (5173)**: Same process

### Services Won't Start

1. Check Docker Desktop is running
2. View logs: `docker-compose logs`
3. Restart Docker Desktop
4. Try: `docker-compose down` then `docker-compose up -d`

### Database Connection Errors

```bash
# Restart PostgreSQL
docker-compose restart postgres

# Check PostgreSQL logs
docker-compose logs postgres

# Verify health
docker-compose exec postgres pg_isready -U postgres
```

### Frontend Can't Reach Backend

1. Verify backend is running: http://localhost:3001/health
2. Check CORS settings in backend `.env`
3. Restart both services: `docker-compose restart backend frontend`

---

## Development Workflow

### Making Code Changes

**Backend Changes**:
- Edit files in `./backend/src/`
- Changes auto-reload (hot reload enabled)
- No restart needed

**Frontend Changes**:
- Edit files in `./frontend/src/`
- Changes auto-reload (Vite HMR)
- No restart needed

**Database Schema Changes**:
1. Edit `./backend/prisma/schema.prisma`
2. Run: `docker-compose exec backend npx prisma migrate dev --name describe_change`
3. Prisma Client regenerates automatically

### Adding New Dependencies

**Backend**:
```bash
docker-compose exec backend npm install <package-name>
docker-compose restart backend
```

**Frontend**:
```bash
docker-compose exec frontend npm install <package-name>
docker-compose restart frontend
```

---

## Next Steps

Once Docker services are running:

1. **Create First User**: Register at http://localhost:5173/register
2. **Configure Executive Team**: Add 7 LLM agent profiles
3. **Test Multi-LLM Chat**: Send message and get responses from multiple agents
4. **Verify VERA Attribution**: Check that contributions are tracked in database

---

## Clean Reset (Start Fresh)

⚠️ **WARNING**: This deletes all data!

```bash
# Stop and remove containers, volumes, and networks
docker-compose down -v

# Remove all images
docker-compose down --rmi all

# Start fresh
docker-compose up -d --build
docker-compose exec backend npx prisma migrate dev --name init
```

---

## Production Deployment

For production deployment, see: `05_DEPLOYMENT_STRATEGY.md`

**Do NOT use these Docker configurations in production!**
- Change all default passwords
- Use proper secrets management
- Enable SSL/TLS
- Configure proper backup strategies
- Set up monitoring and logging

---

## Support

If you encounter issues:
1. Check logs: `docker-compose logs`
2. Review this troubleshooting section
3. Consult `SETUP_GUIDE.md` for detailed explanations
4. Check Docker Desktop resources (CPU, Memory)

---

**Ready to build CollabHub AI!** 🚀
