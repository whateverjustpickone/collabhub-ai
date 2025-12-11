# CollabHub AI - Complete Setup Guide

## Overview
This guide will walk you through setting up the production-grade CollabHub AI platform.

**Timeline**: 6-8 weeks for full implementation
**Current Status**: Foundation created, ready for installation

---

## Prerequisites

### Required Software
1. **Node.js** 20.x LTS or higher
   - Download: https://nodejs.org/
   - Verify: `node --version`

2. **PostgreSQL** 15 or higher
   - Windows: https://www.postgresql.org/download/windows/
   - Verify: `psql --version`

3. **Redis** (for task queues)
   - Windows: https://github.com/microsoftarchive/redis/releases
   - Or use Docker: `docker run -d -p 6379:6379 redis`

4. **Git** (for version control)
   - Download: https://git-scm.com/

### Required API Keys
- **Anthropic**: https://console.anthropic.com/ (Claude)
- **OpenAI**: https://platform.openai.com/ (GPT-4)
- **Google AI**: https://makersuite.google.com/app/apikey (Gemini)
- **Perplexity**: https://www.perplexity.ai/settings/api

---

## Phase 1: Backend Setup (Week 1)

### Step 1: Install Dependencies

```bash
cd C:\Users\990Win7Pro64\Documents\DigitalMuse_Studio\collabhub-ai\backend

# Install Node.js packages
npm install

# or use pnpm for faster installation
npm install -g pnpm
pnpm install
```

### Step 2: Set Up PostgreSQL Database

```bash
# Create database
createdb collabhub_ai

# Or using psql
psql -U postgres
CREATE DATABASE collabhub_ai;
\q
```

### Step 3: Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your credentials
# Use VS Code or any text editor
code .env
```

**Required changes in .env:**
- `DATABASE_URL`: Update with your PostgreSQL credentials
- `ANTHROPIC_API_KEY`: Add your Anthropic API key
- `OPENAI_API_KEY`: Add your OpenAI API key
- `GOOGLE_API_KEY`: Add your Google API key
- `JWT_SECRET`: Generate a secure random string

**Generate JWT Secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### Step 4: Initialize Database with Prisma

```bash
# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate

# Seed initial data (agents, etc.)
npm run prisma:seed
```

### Step 5: Start Backend Server

```bash
# Development mode (with auto-reload)
npm run dev

# Should see:
# ✓ Server running on port 3001
# ✓ Database connected
# ✓ Socket.io initialized
```

---

## Phase 2: Frontend Setup (Week 1)

### Step 1: Initialize Frontend

```bash
cd C:\Users\990Win7Pro64\Documents\DigitalMuse_Studio\collabhub-ai\frontend

# Create Vite + React + TypeScript project
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install

# Install additional packages
npm install @tanstack/react-query zustand socket.io-client axios lucide-react
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Step 2: Configure Tailwind CSS

Edit `tailwind.config.js`:
```javascript
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#4F46E5',  // Indigo
          secondary: '#818CF8',
        },
      },
    },
  },
  plugins: [],
}
```

### Step 3: Start Frontend Development Server

```bash
npm run dev

# Should see:
# ➜  Local:   http://localhost:5173/
```

---

## Phase 3: Implementation Phases

### Week 1-2: Foundation ✅ (CURRENT)
**What we've built:**
- [x] Complete database schema (Prisma)
- [x] Project structure
- [x] Package configurations
- [x] Environment setup

**Next steps:**
- [ ] Create backend API routes
- [ ] Implement authentication
- [ ] Build WebSocket handlers
- [ ] Create UI components

### Week 3: LLM Integration
**Tasks:**
- [ ] Anthropic Claude service
- [ ] OpenAI GPT-4 service
- [ ] Google Gemini service
- [ ] Perplexity service
- [ ] LLM orchestrator
- [ ] Message streaming

**Files to create:**
- `backend/src/services/llm/anthropic.service.ts`
- `backend/src/services/llm/openai.service.ts`
- `backend/src/services/llm/google.service.ts`
- `backend/src/services/llm/llm.orchestrator.ts`

### Week 4: VERA Attribution
**Tasks:**
- [ ] Attribution logging service
- [ ] Content hashing (SHA-256)
- [ ] Contribution calculation
- [ ] Real-time attribution updates
- [ ] Certificate generation

**Files to create:**
- `backend/src/services/vera/attribution.service.ts`
- `backend/src/services/vera/certificate.service.ts`
- `backend/src/services/vera/blockchain.service.ts` (Phase 2)

### Week 5-6: Multi-Agent Coordination
**Tasks:**
- [ ] Task queue (Bull + Redis)
- [ ] Agent routing logic
- [ ] Context management
- [ ] Human approval workflows
- [ ] Agent-to-agent consultation

**Files to create:**
- `backend/src/services/task/queue.service.ts`
- `backend/src/services/task/routing.service.ts`
- `backend/src/services/context/context.service.ts`

### Week 7-8: UI Polish & Features
**Tasks:**
- [ ] Session recording
- [ ] Advanced analytics
- [ ] Certificate UI
- [ ] Performance optimization
- [ ] Testing & debugging

---

## Development Workflow

### Daily Development Process

1. **Start Backend:**
```bash
cd backend
npm run dev
```

2. **Start Frontend:**
```bash
cd frontend
npm run dev
```

3. **View Database:**
```bash
cd backend
npm run prisma:studio
# Opens at http://localhost:5555
```

### Making Database Changes

```bash
# 1. Edit prisma/schema.prisma
# 2. Create migration
npm run prisma:migrate

# 3. Generate new Prisma Client
npm run prisma:generate
```

---

## Testing

### Backend Testing
```bash
cd backend
npm test
```

### API Testing with curl
```bash
# Health check
curl http://localhost:3001/api/health

# Test authentication
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"password"}'
```

---

## Production Deployment

### Build for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Output in: dist/
```

### IONOS Deployment

```bash
# 1. Build both frontend and backend
# 2. Upload to IONOS server via FTP/SFTP
# 3. Configure nginx to serve frontend
# 4. Run backend with PM2

pm2 start dist/server.js --name collabhub-backend
pm2 startup
pm2 save
```

---

## Troubleshooting

### PostgreSQL Connection Issues
```bash
# Test connection
psql -h localhost -U postgres -d collabhub_ai

# If denied, check pg_hba.conf
# Windows: C:\Program Files\PostgreSQL\15\data\pg_hba.conf
```

### Port Already in Use
```bash
# Find process using port 3001
netstat -ano | findstr :3001

# Kill process
taskkill /PID <PID> /F
```

### Prisma Issues
```bash
# Reset database (WARNING: Deletes all data)
npx prisma migrate reset

# Force regenerate client
npx prisma generate --force
```

---

## Next Steps

1. **Complete backend API routes** (I can create these for you)
2. **Build UI components** (Polished, matching FireShot 102)
3. **Integrate LLM APIs** (Real agent conversations)
4. **Implement VERA** (Full attribution tracking)
5. **Test with Digital Muse Studio team** (40-50 agents)

---

## Getting Help

**Issues or Questions?**
- Check logs: `backend/logs/`
- Review Prisma Studio: `npm run prisma:studio`
- Check API docs: `docs/API.md` (to be created)

**Ready to Continue?**
Let me know which component you'd like me to build next:
1. Backend API routes and controllers
2. Frontend UI components (matching target design)
3. LLM integration services
4. VERA attribution system

---

**Status**: Phase 1 Foundation Complete ✅
**Next**: Phase 2 Implementation
**Timeline**: 6 more weeks to production-ready platform
