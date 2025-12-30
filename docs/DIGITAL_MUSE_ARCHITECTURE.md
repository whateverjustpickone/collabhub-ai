# Digital Muse: Technical Architecture Documentation

**Version:** 1.0
**Last Updated:** December 30, 2025
**Authors:** CollabHub AI Engineering Team

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagrams](#architecture-diagrams)
3. [Component Specifications](#component-specifications)
4. [Data Flow](#data-flow)
5. [API Specifications](#api-specifications)
6. [Deployment Architecture](#deployment-architecture)
7. [Performance Optimization](#performance-optimization)
8. [Security Considerations](#security-considerations)
9. [Monitoring & Observability](#monitoring--observability)

---

## System Overview

### High-Level Architecture

Digital Muse is a **local-first hybrid AI system** that intelligently routes queries between local inference (Digital Muse Core running on Ollama) and cloud-based LLM APIs (Executive Team).

**Key Components:**
1. **Digital Muse Core** - Local LLM (Llama 3.3 70B fine-tuned)
2. **Intelligent Router** - Query classification and routing logic
3. **Cloud Executive Team** - 12 specialized cloud LLM services
4. **Context Manager** - Enriched context injection system
5. **Synthesis Engine** - Multi-response aggregation

### Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Local Inference** | Ollama + Llama 3.3 70B | Digital Muse Core execution |
| **Backend API** | Node.js + Express + TypeScript | Request handling and routing |
| **Database** | PostgreSQL 16 + Prisma ORM | Persistent data storage |
| **Frontend** | React 19.2.0 + TypeScript | User interface |
| **State Management** | Zustand | Frontend state |
| **Containerization** | Docker + Docker Compose | Deployment packaging |
| **Cloud APIs** | Anthropic, OpenAI, Google, etc. | Executive Team services |

---

## Architecture Diagrams

### Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CollabHub AI Platform                    │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │                    Frontend (React)                       │ │
│  │  - Chat Interface                                         │ │
│  │  - Agent Selection                                        │ │
│  │  - Digital Muse Status Badge                              │ │
│  │  - Cost/Performance Analytics                             │ │
│  └───────────────────────────┬───────────────────────────────┘ │
│                              │ WebSocket + REST                 │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │              Backend API (Node.js/Express)                │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │           Intelligent Router Service                 │ │ │
│  │  │  - Query analysis                                    │ │ │
│  │  │  - Complexity classification                         │ │ │
│  │  │  - Cost optimization                                 │ │ │
│  │  │  - Agent selection                                   │ │ │
│  │  └────────────────┬───────────────┬─────────────────────┘ │ │
│  │                   │               │                        │ │
│  │      ┌────────────▼──────┐   ┌───▼─────────────────────┐ │ │
│  │      │  Digital Muse     │   │  Cloud Executive Team   │ │ │
│  │      │  Service          │   │  Services               │ │ │
│  │      │                   │   │                         │ │ │
│  │      │  - Triage         │   │  - Anthropic (Claude)   │ │ │
│  │      │  - Simple Q&A     │   │  - OpenAI (GPT)         │ │ │
│  │      │  - Summarization  │   │  - Google (Gemini)      │ │ │
│  │      │  - Code analysis  │   │  - Perplexity           │ │ │
│  │      │  - Synthesis      │   │  - 8 other specialists  │ │ │
│  │      └────────┬──────────┘   └───┬─────────────────────┘ │ │
│  │               │                  │                        │ │
│  │               ▼                  ▼                        │ │
│  │      ┌─────────────────────────────────────────────────┐ │ │
│  │      │        Context Injection Service                │ │ │
│  │      │  - Document retrieval                           │ │ │
│  │      │  - Code context                                 │ │ │
│  │      │  - GitHub integration                           │ │ │
│  │      │  - Knowledge Library                            │ │ │
│  │      └─────────────────────────────────────────────────┘ │ │
│  └───────────────────────────┬───────────────────────────────┘ │
│                              │                                  │
│  ┌───────────────────────────▼───────────────────────────────┐ │
│  │                 Data Layer (PostgreSQL)                   │ │
│  │  - Conversations                                          │ │
│  │  - Messages                                               │ │
│  │  - Knowledge Library                                      │ │
│  │  - GitHub Repositories                                    │ │
│  │  - Query Analytics                                        │ │
│  └───────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │           External Services                               │ │
│  │                                                           │ │
│  │  ┌─────────────────┐     ┌─────────────────────────────┐ │ │
│  │  │  Ollama Server  │     │   Cloud LLM APIs            │ │ │
│  │  │  (localhost)    │     │   (api.anthropic.com, etc.) │ │ │
│  │  │                 │     │                             │ │ │
│  │  │  Digital Muse   │     │   12 Executive Services     │ │ │
│  │  │  70B Model      │     │                             │ │ │
│  │  └─────────────────┘     └─────────────────────────────┘ │ │
│  └───────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Query Routing Flow

```
User Query
    │
    ▼
┌─────────────────────┐
│ Intelligent Router  │
│ (Digital Muse)      │
└──────────┬──────────┘
           │
           ├─── Complexity Analysis
           │    (local, <100ms, $0)
           │
           ▼
    ┌──────────────┐
    │ Classification│
    └──────┬───────┘
           │
           ├───[Simple]──────► Digital Muse Local
           │                   ├─ Q&A
           │                   ├─ Code completion
           │                   ├─ Syntax check
           │                   └─ Summarization
           │                   (200ms, $0)
           │
           ├───[Moderate]─────► Hybrid Approach
           │                   ├─ Local pre-processing
           │                   ├─ 1-2 Cloud agents
           │                   └─ Local synthesis
           │                   (2-3s, $0.02)
           │
           └───[Complex]──────► Full Executive Team
                               ├─ Local context prep
                               ├─ 4+ Cloud agents
                               ├─ Parallel consultation
                               └─ Local synthesis
                               (5-8s, $0.06)
```

### Data Flow Sequence

```
1. User submits query
   └─> Frontend (React)

2. WebSocket connection to backend
   └─> server-minimal.ts

3. Query enters Intelligent Router
   └─> intelligent-router.service.ts

4. Digital Muse performs triage
   └─> digital-muse.service.ts
   └─> Ollama API (local)

5a. [Simple Query Path]
    └─> Digital Muse handles entirely locally
    └─> Response returned immediately

5b. [Complex Query Path]
    └─> Context injection service gathers relevant data
        └─> context-injection.service.ts
        └─> Knowledge Library search
        └─> GitHub file retrieval
    └─> Cloud Executive Team consulted
        └─> anthropic.ts, openai.ts, etc.
        └─> Parallel API calls
    └─> Digital Muse synthesizes responses
        └─> digital-muse.service.ts
        └─> Ollama API (local)

6. Response streamed to frontend
   └─> WebSocket
   └─> React UI updates

7. Analytics recorded
   └─> PostgreSQL
   └─> Cost tracking
   └─> Performance metrics
```

---

## Component Specifications

### 1. Digital Muse Service

**File:** `backend/src/services/digital-muse/digital-muse.service.ts`

**Responsibilities:**
- Query triage and complexity classification
- Local inference for simple queries
- Context preparation for cloud agents
- Response synthesis from multiple sources
- Caching and retrieval

**Key Methods:**

```typescript
class DigitalMuseService {
  // Classify query complexity and recommend routing
  async triage(query: string): Promise<TriageResult>;

  // Handle simple queries entirely locally
  async answerSimple(query: string, context?: EnrichedContext): Promise<string>;

  // Prepare context for cloud agents (formatting, summarization)
  async prepareContext(context: EnrichedContext): Promise<PreparedContext>;

  // Synthesize multiple agent responses into cohesive answer
  async synthesize(responses: AgentResponse[]): Promise<SynthesizedResponse>;

  // Initial code review pass (before cloud escalation)
  async reviewCodeInitial(files: CodeFile[]): Promise<InitialReview>;

  // Summarize documents/PRs/issues
  async summarize(content: string, maxLength?: number): Promise<string>;
}
```

**Model Configuration:**

```typescript
interface DigitalMuseConfig {
  modelName: 'digital-muse:latest' | 'digital-muse:70b' | 'digital-muse:32b';
  baseURL: string; // Default: 'http://localhost:11434'
  temperature: number; // Default: 0.7
  maxTokens: number; // Default: 2048
  timeout: number; // Default: 30000ms
}
```

### 2. Intelligent Router Service

**File:** `backend/src/services/routing/intelligent-router.service.ts`

**Responsibilities:**
- Determine optimal routing strategy
- Cost optimization
- Performance monitoring
- Fallback handling

**Routing Logic:**

```typescript
interface RoutingStrategy {
  approach: 'local' | 'hybrid' | 'cloud-full';
  agents: string[]; // Agent IDs to consult
  estimatedCost: number;
  estimatedTime: number;
  confidence: number; // 0-1
}

class IntelligentRouter {
  async route(
    query: string,
    context: EnrichedContext,
    userPreferences?: UserPreferences
  ): Promise<RoutingStrategy>;
}
```

**Decision Matrix:**

| Complexity | Query Length | Context Size | Strategy | Agents | Est. Cost |
|------------|--------------|--------------|----------|--------|-----------|
| Simple | <200 chars | <5KB | Local | Digital Muse | $0 |
| Simple | >200 chars | <10KB | Local | Digital Muse | $0 |
| Moderate | Any | <50KB | Hybrid | DM + 1-2 cloud | $0.02 |
| Moderate | Any | >50KB | Hybrid | DM + 2 cloud | $0.03 |
| Complex | Any | Any | Cloud-full | DM + 4+ cloud | $0.06+ |

### 3. Context Injection Service

**File:** `backend/src/services/context/context-injection.service.ts`

**Responsibilities:**
- Retrieve relevant documents from Knowledge Library
- Fetch GitHub file content
- Format context for different model types
- Token budget management

**Interface:**

```typescript
interface EnrichedContext {
  documents: Document[]; // From Knowledge Library
  codeFiles: CodeFile[]; // From GitHub
  conversationHistory: Message[];
  metadata: {
    totalTokens: number;
    priority: 'high' | 'medium' | 'low';
    sources: string[];
  };
}

class ContextInjectionService {
  async enrichContext(
    query: string,
    conversationId: string,
    options?: ContextOptions
  ): Promise<EnrichedContext>;

  formatContextForPrompt(
    context: EnrichedContext,
    modelType: ModelType
  ): string;
}
```

### 4. Cloud Executive Team Services

**Directory:** `backend/src/services/llm-minimal/`

**Files:**
- `anthropic.ts` - Claude 3.5 Sonnet, Opus
- `openai.ts` - GPT-4 Turbo, GPT-4
- `google.ts` - Gemini 1.5 Pro
- `perplexity.ts` - Perplexity AI
- `mistral.ts` - Mistral Large
- `grok.ts` - Grok 2
- `deepseek.ts` - DeepSeek Chat
- `manus.ts` - Manus AI
- `llama.ts` - Meta Llama 3.3
- `cohere.ts` - Cohere Command R+
- `qwen.ts` - Qwen 2.5
- `inflection.ts` - Inflection Pi

**Standardized Interface:**

```typescript
interface LLMService {
  chat(
    userMessage: string,
    conversationHistory?: ConversationMessage[],
    enrichedContext?: EnrichedContext
  ): Promise<string>;

  streamChat?(
    userMessage: string,
    conversationHistory?: ConversationMessage[],
    enrichedContext?: EnrichedContext
  ): AsyncGenerator<string>;
}
```

---

## API Specifications

### Digital Muse Endpoints

**Base URL:** `http://localhost:3001/api/digital-muse`

#### POST /api/digital-muse/triage

Classify query complexity and recommend routing strategy.

**Request:**
```json
{
  "query": "How do I implement authentication in Node.js?",
  "context": {
    "conversationId": "uuid",
    "userPreferences": {
      "maxCost": 0.05,
      "preferLocal": true
    }
  }
}
```

**Response:**
```json
{
  "complexity": "moderate",
  "recommended_strategy": "hybrid",
  "recommended_agents": ["digital-muse", "claude-3.5-sonnet"],
  "estimated_cost": 0.02,
  "estimated_time_ms": 2500,
  "confidence": 0.87,
  "reasoning": "Query requires code examples which benefit from cloud model expertise, but Digital Muse can handle initial analysis and synthesis."
}
```

#### POST /api/digital-muse/answer

Get answer from Digital Muse (local only).

**Request:**
```json
{
  "query": "What is a REST API?",
  "context": {
    "conversationHistory": [...],
    "enrichedContext": {...}
  }
}
```

**Response:**
```json
{
  "answer": "A REST API (Representational State Transfer Application Programming Interface)...",
  "executionTime_ms": 180,
  "cost": 0,
  "source": "digital-muse-local",
  "model": "digital-muse:70b",
  "confidence": 0.92
}
```

#### POST /api/digital-muse/synthesize

Synthesize multiple agent responses.

**Request:**
```json
{
  "query": "Review this authentication code",
  "responses": [
    {
      "agent": "claude-3.5-sonnet",
      "content": "The code has a SQL injection vulnerability...",
      "confidence": 0.95
    },
    {
      "agent": "gpt-4-turbo",
      "content": "Consider using bcrypt with higher rounds...",
      "confidence": 0.89
    }
  ]
}
```

**Response:**
```json
{
  "synthesized_answer": "Your authentication code has two critical issues that need attention:\n\n1. **SQL Injection Vulnerability** (Critical)...",
  "key_insights": [...],
  "consensus_score": 0.92,
  "execution_time_ms": 450,
  "cost": 0
}
```

---

## Deployment Architecture

### Development Environment

```yaml
# docker-compose.dev.yml
version: '3.8'

services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: collabhub_ai
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_models:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]

  backend:
    build: ./backend
    ports:
      - "3001:3001"
    environment:
      DATABASE_URL: postgresql://admin:${DB_PASSWORD}@postgres:5432/collabhub_ai
      OLLAMA_HOST: http://ollama:11434
      NODE_ENV: development
    depends_on:
      - postgres
      - ollama
    volumes:
      - ./backend:/app
      - /app/node_modules

  frontend:
    build: ./frontend
    ports:
      - "5173:5173"
    environment:
      VITE_API_URL: http://localhost:3001
    volumes:
      - ./frontend:/app
      - /app/node_modules

volumes:
  postgres_data:
  ollama_models:
```

### Production Environment (IONOS VPS)

**Server Requirements:**
- **CPU:** 16+ cores (for Ollama inference)
- **RAM:** 64GB+ (for 70B model)
- **GPU:** NVIDIA RTX 4090 or A100 (recommended)
- **Storage:** 500GB+ SSD
- **OS:** Ubuntu 22.04 LTS

**Docker Compose Production:**

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - backend

  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: collabhub_ai
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: always

  ollama:
    image: ollama/ollama:latest
    volumes:
      - ollama_models:/root/.ollama
    deploy:
      resources:
        reservations:
          devices:
            - driver: nvidia
              count: 1
              capabilities: [gpu]
    restart: always

  backend:
    image: collabhub-ai-backend:latest
    environment:
      DATABASE_URL: postgresql://admin:${DB_PASSWORD}@postgres:5432/collabhub_ai
      OLLAMA_HOST: http://ollama:11434
      NODE_ENV: production
      JWT_SECRET: ${JWT_SECRET}
    depends_on:
      - postgres
      - ollama
    restart: always

  frontend:
    image: collabhub-ai-frontend:latest
    environment:
      VITE_API_URL: https://api.collabhub.ai
    restart: always

volumes:
  postgres_data:
  ollama_models:
```

---

## Performance Optimization

### 1. Ollama Configuration

**Optimal Settings for Production:**

```bash
# ~/.ollama/config.json
{
  "num_thread": 16,
  "num_gpu": 1,
  "num_batch": 512,
  "num_ctx": 8192,
  "rope_freq_base": 10000,
  "rope_freq_scale": 1.0,
  "low_vram": false,
  "f16_kv": true,
  "logits_all": false,
  "vocab_only": false,
  "use_mmap": true,
  "use_mlock": true,
  "num_keep": 4
}
```

### 2. Model Quantization

| Quantization | Size | Speed | Quality | Recommended Use |
|--------------|------|-------|---------|-----------------|
| Q4_0 | 40GB | Fast | Good | Development |
| Q5_K_M | 48GB | Medium | Better | Production (most users) |
| Q8_0 | 70GB | Slow | Best | Enterprise (high-end hardware) |

### 3. Caching Strategy

**Multi-Level Cache:**

```typescript
// Level 1: In-memory cache (Redis)
// - Triage results (TTL: 1 hour)
// - Simple Q&A (TTL: 24 hours)
// - Semantic similarity threshold: 0.95

// Level 2: Semantic cache (PostgreSQL + pgvector)
// - Complex queries (TTL: 7 days)
// - Semantic similarity threshold: 0.85

// Level 3: CDN cache (Cloudflare)
// - Static responses (TTL: 30 days)
// - Public documentation queries
```

### 4. Load Balancing

**Multiple Ollama Instances:**

```yaml
# For high-traffic deployments
services:
  ollama-1:
    image: ollama/ollama:latest
    # ... config

  ollama-2:
    image: ollama/ollama:latest
    # ... config

  ollama-lb:
    image: nginx:alpine
    # Round-robin load balancing
```

---

## Security Considerations

### 1. Data Privacy

**Local-First Guarantees:**
- Sensitive queries never leave local network
- User can configure which query types stay local
- Audit log of all cloud API calls

### 2. API Key Management

```typescript
// Secure key storage
// - Backend: Environment variables only
// - No hardcoded keys
// - Rotation policy: 90 days
// - Separate keys per environment

interface APIKeyConfig {
  provider: string;
  key: string;
  encryptedAt: Date;
  rotateAt: Date;
  usageLimit?: number;
}
```

### 3. Rate Limiting

```typescript
// Prevent abuse
const rateLimits = {
  local: Infinity, // No limit on local queries
  cloud_free_tier: 100, // per day
  cloud_pro_tier: 1000, // per day
  cloud_enterprise: Infinity
};
```

### 4. Content Filtering

```typescript
// Digital Muse includes content safety checks
async function contentFilter(query: string): Promise<SafetyCheck> {
  // Check for:
  // - Malicious code injection attempts
  // - Prompt injection attacks
  // - PII exposure risks
  // - Policy violations
}
```

---

## Monitoring & Observability

### Key Metrics

```typescript
interface PerformanceMetrics {
  // Query metrics
  total_queries: number;
  local_queries: number;
  cloud_queries: number;
  hybrid_queries: number;

  // Performance
  avg_latency_local: number;
  avg_latency_cloud: number;
  p95_latency: number;
  p99_latency: number;

  // Cost
  total_cost: number;
  cost_per_query: number;
  cost_savings_vs_cloud: number;

  // Quality
  user_satisfaction: number; // 1-5 rating
  retry_rate: number;
  error_rate: number;

  // Resource utilization
  ollama_cpu_usage: number;
  ollama_memory_usage: number;
  ollama_gpu_usage: number;
}
```

### Logging Strategy

```typescript
// Structured logging with Winston
logger.info('Query processed', {
  query_id: 'uuid',
  routing_strategy: 'hybrid',
  agents_used: ['digital-muse', 'claude'],
  execution_time_ms: 2340,
  cost: 0.023,
  user_satisfaction: 5,
  timestamp: new Date().toISOString()
});
```

### Alerting Rules

1. **Critical:**
   - Ollama service down
   - Error rate > 5%
   - P95 latency > 10s

2. **Warning:**
   - GPU memory > 90%
   - Cost spike > 200% average
   - Local routing < 60% (target: 70%)

---

## Appendix: File Structure

```
collabhub-ai/
├── backend/
│   ├── src/
│   │   ├── services/
│   │   │   ├── digital-muse/
│   │   │   │   ├── digital-muse.service.ts
│   │   │   │   ├── triage.ts
│   │   │   │   ├── synthesis.ts
│   │   │   │   └── ollama-client.ts
│   │   │   ├── routing/
│   │   │   │   ├── intelligent-router.service.ts
│   │   │   │   └── cost-optimizer.ts
│   │   │   ├── llm-minimal/
│   │   │   │   ├── anthropic.ts
│   │   │   │   ├── openai.ts
│   │   │   │   └── ... (10 more)
│   │   │   └── context/
│   │   │       └── context-injection.service.ts
│   │   ├── controllers/
│   │   │   └── digital-muse.controller.ts
│   │   └── server-minimal.ts
│   ├── package.json
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   └── DigitalMuseBadge.tsx
│   │   └── services/
│   │       └── digitalMuse.ts
│   └── package.json
├── docs/
│   ├── DIGITAL_MUSE_STRATEGY.md
│   ├── DIGITAL_MUSE_ARCHITECTURE.md
│   ├── IONOS_DEPLOYMENT.md
│   └── DIGITAL_MUSE_TRAINING.md
└── docker-compose.yml
```

---

**End of Technical Architecture Documentation**
