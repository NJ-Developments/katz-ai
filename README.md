# KatzAI - Retail AI Assistant SaaS Platform

## 🎯 Overview
IS a SaaS Katz will be our example company we will use to test this in first 
KatzAI is an AI-powered retail assistant platform that helps store employees answer customer questions with accurate, inventory-grounded recommendations. The system enforces "Truth Mode" - never hallucinating products, only recommending in-stock items.

### Key Features
- **Push-to-Talk Voice Assistant**: Employees speak customer questions, get AI-powered answers
- **Truth Mode**: All recommendations verified against real inventory - no hallucinations
- **Multi-Tenant SaaS**: Each store has isolated data, policies, and users
- **Product Cards**: Visual recommendations with price, location, stock, and reasoning
- **Smart Cart**: Build shopping lists from recommendations
- **Admin Dashboard**: Manage stores, inventory, users, and view analytics

---

## 📋 Assumptions & Defaults

| Component | Choice | Rationale |
|-----------|--------|-----------|
| **Monorepo** | pnpm workspaces | Fast, efficient disk usage |
| **Backend** | Fastify + TypeScript | High performance, great DX |
| **Database** | PostgreSQL + pgvector | Full-text search + semantic search ready |
| **ORM** | Prisma | Type-safe, great migrations |
| **Auth** | JWT + bcrypt | Simple, stateless, secure |
| **LLM** | Anthropic Claude (pluggable) | Best reasoning, configurable |
| **Transcription** | OpenAI Whisper API (pluggable) | Accurate, widely available |
| **Mobile** | Expo React Native | Cross-platform, fast dev |
| **Admin** | Next.js 14 App Router | Modern React, SSR capable |
| **TTS** | Device native (Expo Speech) | No additional API needed |

---

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- pnpm 8+
- Docker & Docker Compose
- (For mobile) Expo CLI, iOS Simulator or Android Emulator

### 1. Clone & Install

```bash
cd KatzAI
pnpm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your API keys
```

Required environment variables:
```
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/katzai
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...  # For Whisper transcription
```

### 3. Start Database

```bash
docker-compose up -d
```

### 4. Run Migrations & Seed

```bash
cd apps/api
pnpm prisma migrate dev
pnpm prisma db seed
```

### 5. Start All Apps

```bash
# Terminal 1 - Backend API
cd apps/api && pnpm dev

# Terminal 2 - Admin Dashboard
cd apps/admin && pnpm dev

# Terminal 3 - Mobile App
cd apps/mobile && pnpm start
```

### Access Points

| App | URL |
|-----|-----|
| Backend API | http://localhost:3001 |
| Admin Dashboard | http://localhost:3000 |
| Mobile (Expo) | Expo Go app on device |

---

## 🔐 Demo Credentials

After seeding, use these accounts:

| Role | Email | Password |
|------|-------|----------|
| Manager | manager@demo-store.com | Demo123! |
| Employee | employee@demo-store.com | Demo123! |

Demo Store: **Demo Hardware Store**

---

## 📁 Project Structure

```
KatzAI/
├── apps/
│   ├── api/                 # Fastify backend
│   │   ├── src/
│   │   │   ├── modules/     # Feature modules
│   │   │   ├── plugins/     # Fastify plugins
│   │   │   ├── adapters/    # LLM, Transcription adapters
│   │   │   └── lib/         # Utilities
│   │   ├── prisma/          # Schema & migrations
│   │   └── tests/           # Vitest tests
│   ├── admin/               # Next.js admin dashboard
│   │   ├── app/             # App router pages
│   │   ├── components/      # React components
│   │   └── lib/             # API client, utils
│   └── mobile/              # Expo React Native app
│       ├── app/             # Expo router screens
│       ├── components/      # RN components
│       └── lib/             # API client, utils
├── packages/
│   └── shared/              # Shared types & utils
├── docker-compose.yml
├── .env.example
└── pnpm-workspace.yaml
```

---

## 📊 Sample CSV Template

Upload inventory via Admin Dashboard or API. CSV format:

```csv
sku,name,description,category,price,stock,aisle,bin,tags,attributes
CMD-STRIPS-MED,"Command Medium Picture Hanging Strips","Damage-free hanging strips, holds up to 12 lbs",hanging,8.99,45,A3,12,"no-damage,rental-friendly","{""weight_capacity_lbs"":12,""surface_types"":[""painted drywall"",""glass"",""tile""]}"
DRYWALL-ANCHOR-50,"Drywall Anchors 50-Pack","Heavy duty plastic anchors for drywall",hardware,12.99,30,B2,5,"drilling-required","{""weight_capacity_lbs"":50,""requires_drill"":true}"
MONKEY-HOOK-10,"Monkey Hooks 10-Pack","No-tool picture hangers for drywall",hanging,9.99,25,A3,14,"no-damage,no-tools","{""weight_capacity_lbs"":35,""surface_types"":[""drywall""]}"
```

### CSV Fields

| Field | Required | Description |
|-------|----------|-------------|
| sku | Yes | Unique product identifier |
| name | Yes | Product name |
| description | Yes | Detailed description |
| category | Yes | Product category |
| price | Yes | Price (decimal) |
| stock | Yes | Current stock count |
| aisle | Yes | Aisle location |
| bin | No | Bin/shelf location |
| tags | No | Comma-separated tags |
| attributes | No | JSON object with extra data |

---

## 🧪 Demo Flow: Picture Hanging Question

1. **Login as Employee** (mobile app)
2. **Tap & Hold Push-to-Talk**
3. **Speak**: "Command strips won't work on my slippery wall. I don't want to damage drywall. How do I hang a metal frame picture?"
4. **AI asks clarifying questions**:
   - "How heavy is the picture?"
   - "Is the wall painted drywall, tile, or plaster?"
   - "Is this a rental where you need damage-free options?"
5. **Answer**: "About 15 pounds, painted drywall, yes it's a rental"
6. **AI recommends** (from actual inventory):
   - Monkey Hooks (Aisle A3, Bin 14) - "Best for drywall up to 35lbs, no tools needed"
   - Heavy Duty Command Strips (if in stock) - as backup
7. **View product cards** with locations, prices, reasoning
8. **Add to cart** and share list

---

## 🛡️ Truth Mode

The system enforces strict inventory grounding:

1. **Retrieval**: Search inventory for relevant products
2. **LLM Prompt**: Only allowed to reference retrieved SKUs
3. **Validation**: Backend verifies all recommended SKUs exist in retrieval results
4. **Fallback**: If validation fails, returns safe message asking employee to verify manually

```
❌ "We have the XYZ Super Anchor..." (hallucinated)
✅ "Based on our inventory, I found these options: [actual products]"
✅ "I couldn't find a matching product. Please check aisle B2 for anchors."
```

---

## 🔧 API Endpoints

### Auth
- `POST /auth/login` - Login, returns JWT
- `POST /auth/register` - Register (manager creates employees)

### Stores
- `POST /stores` - Create store (onboarding)
- `GET /stores/me` - Get current store
- `PATCH /stores/:id/policies` - Update store policies

### Inventory
- `POST /inventory/upload-csv` - Upload CSV file
- `GET /inventory/search` - Search with query & constraints
- `GET /inventory/:sku` - Get single item

### Assistant
- `POST /assistant/ask` - Text transcript in, recommendations out
- `POST /assistant/ask-audio` - Audio in, transcript + recommendations out

### Carts
- `POST /carts` - Create cart
- `GET /carts/:id` - Get cart

### Analytics
- `GET /analytics/overview` - Dashboard stats

---

## 🐛 Troubleshooting

### Database connection failed
```bash
# Ensure Docker is running
docker-compose ps

# Restart containers
docker-compose down && docker-compose up -d

# Check logs
docker-compose logs postgres
```

### Prisma migration issues
```bash
cd apps/api
pnpm prisma migrate reset  # WARNING: Deletes all data
pnpm prisma db seed
```

### Mobile app can't connect to API
```bash
# Update API_URL in apps/mobile/.env
# Use your machine's IP, not localhost
API_URL=http://192.168.1.xxx:3001
```

### LLM/Transcription errors
- Verify API keys in `.env`
- Check rate limits on Anthropic/OpenAI dashboards
- Review logs: `docker-compose logs api`

---

## 🧪 Running Tests

```bash
cd apps/api
pnpm test
```

Tests verify:
- ✅ Truth Mode rejects hallucinated SKUs
- ✅ Returns safe fallback when no inventory matches
- ✅ Respects "no-damage" constraint preferences
- ✅ Tenant isolation (store_id scoping)

---

## 📄 License

MIT - See LICENSE file
