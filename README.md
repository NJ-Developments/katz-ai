# 🏪 KatzAI - Retail AI Assistant Platform

> **An AI-powered in-store assistant for hardware retail employees.**  
> Built for ACE Hardware and similar retail stores to help employees answer customer questions with grounded, truthful product recommendations.

---

## 🎯 What Is This?

KatzAI is a **SaaS platform** that puts an AI assistant in the hands of retail store employees. Think of it as a smart, voice-enabled product finder that:

1. **Listens** to what a customer needs ("I want to hang a heavy mirror without drilling")
2. **Searches** your store's actual inventory
3. **Recommends** only products you have in stock with locations (Aisle 3, Bin A)
4. **Explains** why each product works for the customer's use case
5. **Prevents hallucinations** via "Truth Mode" - AI can only recommend SKUs from your inventory

### The Problem We Solve

Retail employees face constant questions:
- "What do I need to hang this?" 
- "Will this work on tile?"
- "What's the difference between these anchors?"

New employees don't know the answers. Experienced employees are busy. Customers wait.

**KatzAI gives every employee instant access to product expertise.**

---

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           KatzAI Platform                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │   Employee   │    │   Manager    │    │    Mobile    │               │
│  │   Tablet UI  │    │  Dashboard   │    │     App      │               │
│  │  (Next.js)   │    │  (Next.js)   │    │   (Future)   │               │
│  └──────┬───────┘    └──────┬───────┘    └──────────────┘               │
│         │                   │                                            │
│         ▼                   ▼                                            │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                     REST API (Fastify)                           │    │
│  │  • /auth/* - JWT authentication                                  │    │
│  │  • /assistant/ask - AI conversation endpoint                     │    │
│  │  • /inventory/* - Product CRUD & search                          │    │
│  │  • /carts/* - Shopping cart management                           │    │
│  │  • /analytics/* - Usage metrics                                  │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│         │                                                                │
│         ▼                                                                │
│  ┌─────────────────────────────────────────────────────────────────┐    │
│  │                    AI + Truth Mode Layer                         │    │
│  │                                                                   │    │
│  │  1. Parse user query → extract constraints                       │    │
│  │  2. Search inventory → get candidate products                    │    │
│  │  3. Call LLM with ONLY allowed SKUs                              │    │
│  │  4. Validate response → reject hallucinated SKUs                 │    │
│  │  5. Return grounded recommendations                              │    │
│  └─────────────────────────────────────────────────────────────────┘    │
│         │                                                                │
│         ▼                                                                │
│  ┌─────────────┐    ┌──────────────┐    ┌──────────────┐               │
│  │   SQLite    │    │ Google Gemini│    │   Browser    │               │
│  │  Database   │    │  (FREE LLM)  │    │  Speech API  │               │
│  └─────────────┘    └──────────────┘    └──────────────┘               │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Backend (`apps/api`)
| Technology | Purpose | Why |
|------------|---------|-----|
| **Fastify** | REST API framework | Fast, TypeScript-native, plugin architecture |
| **Prisma** | Database ORM | Type-safe queries, migrations, multi-DB support |
| **SQLite** | Database | Zero config, perfect for dev/demo, swap to Postgres for production |
| **JWT** | Authentication | Stateless, standard auth tokens |
| **Zod** | Validation | Runtime type checking for API inputs |

### Frontend (`apps/admin`)
| Technology | Purpose | Why |
|------------|---------|-----|
| **Next.js 14** | React framework | App Router, server components, great DX |
| **TailwindCSS** | Styling | Utility-first, fast iteration |
| **Lucide React** | Icons | Clean, consistent icon set |
| **Web Speech API** | Voice input | Native browser speech-to-text, no extra cost |
| **SpeechSynthesis** | Voice output | Native browser TTS for reading responses |

### AI Layer
| Technology | Purpose | Why |
|------------|---------|-----|
| **Google Gemini 1.5 Flash** | LLM | **FREE tier**, fast, JSON mode support |
| **Truth Mode** | Hallucination prevention | Custom validation layer |
| **Constraint Extraction** | Query understanding | Parse "no drill", "heavy", "budget" from natural language |

### 💰 100% FREE Stack
- **AI**: Google Gemini (free tier - 60 req/min)
- **Database**: PostgreSQL via Neon.tech (free tier)
- **API Hosting**: Railway ($5 free credit)
- **Frontend Hosting**: Vercel (free)
- **Voice**: Browser Web Speech API (free, no external service)**

---

## 📁 Project Structure

```
KatzAI/
├── apps/
│   ├── api/                 # Fastify backend
│   │   ├── prisma/          # Database schema + seed
│   │   │   ├── schema.prisma
│   │   │   ├── seed.ts      # Demo users + products
│   │   │   └── seed-data/   # CSV files for inventory
│   │   └── src/
│   │       ├── adapters/    # LLM adapters (Gemini, Anthropic)
│   │       ├── modules/     # Feature routes (auth, assistant, inventory)
│   │       └── lib/         # Shared utilities
│   │
│   └── admin/               # Next.js web app
│       └── app/
│           ├── (auth)/      # Login page
│           ├── employee/    # Employee UI (assistant, inventory)
│           └── dashboard/   # Manager dashboard (users, analytics)
│
├── packages/
│   └── shared/              # Shared types & constants
│
├── railway.json             # Railway deployment config
└── README.md
```

---

## 🔐 Role-Based Access Control (RBAC)

| Role | Access | Route After Login |
|------|--------|-------------------|
| **EMPLOYEE** | Simple assistant UI, inventory search, cart | `/employee/assistant` |
| **MANAGER** | Full dashboard + analytics + users | `/dashboard` |
| **ADMIN** | Everything + system settings | `/dashboard` |

### Employee View (Tablet-Optimized)
- Big microphone button to ask questions via voice
- Quick inventory search
- Recent conversation history
- Shopping cart for customer checkouts
- Simple, distraction-free UI

### Manager View (Full Dashboard)
- User management (create employees)
- Inventory uploads (CSV import)
- Store policy configuration
- Analytics and conversation logs
- All employee features

---

## 🧠 Truth Mode - How It Works

The core innovation of KatzAI is **Truth Mode**: the AI can ONLY recommend products that exist in your inventory.

### The Problem with Generic AI

```
Customer: "What should I use to hang a heavy mirror?"

Generic AI (ChatGPT): "I recommend the Gorilla Heavy Duty Mounting Tape..."
   → Product might not exist in your store
   → Employee looks foolish
   → Customer frustrated

KatzAI: "Based on your inventory, I found Heavy Duty Monkey Hooks 
        in Aisle 3, Bin B - they hold up to 35 lbs..."
   → Product verified in stock
   → Location provided
   → Customer happy
```

### Truth Mode Flow

```
Customer asks: "I need to hang a 30lb mirror without drilling"
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 1. CONSTRAINT EXTRACTION                                                 │
│    • noDrilling = true                                                   │
│    • minWeight = 30 lbs                                                  │
│    • surfaceType = unknown (ask follow-up)                               │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 2. INVENTORY SEARCH                                                      │
│    Query: "hang mirror no-drill heavy-duty adhesive strips"              │
│    Filters: stock > 0, weight_capacity >= 30, requires_drill = false     │
│    Result: 8 matching products                                           │
│    Allowed SKUs: [CMD-STRIPS-XL, MONKEY-HOOK-HD, ...]                    │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 3. LLM PROMPT (with inventory context)                                   │
│                                               a                           │
│    SYSTEM: You are a hardware store assistant. You can ONLY recommend   │
│    products from this list: [CMD-STRIPS-XL, MONKEY-HOOK-HD, ...]        │
│                                                                          │
│    INVENTORY:                                                            │
│    - CMD-STRIPS-XL: Command XL Strips, $11.99, 24 in stock, Aisle 7     │
│      Weight: 24 lbs, No drill, Removable                                │
│    - MONKEY-HOOK-HD: Heavy Duty Hooks, $8.99, 15 in stock, Aisle 3      │
│      Weight: 35 lbs, No drill, Minimal damage                           │
│                                                                          │
│    USER: I need to hang a 30lb mirror without drilling                  │
│                                                                          │
│    Respond with recommended SKUs and reasoning                          │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 4. TRUTH MODE VALIDATION                                                 │
│                                                                          │
│    LLM Response: { recommended_skus: ["MONKEY-HOOK-HD", "FAKE-SKU"] }   │
│                                                                          │
│    ❌ "FAKE-SKU" not in allowed list → REMOVED                          │
│    ✅ "MONKEY-HOOK-HD" valid → KEPT                                     │
│                                                                          │
│    If all SKUs invalid → Return safe fallback (no recommendations)      │
└─────────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────────┐
│ 5. HYDRATE RESPONSE                                                      │
│                                                                          │
│    Convert SKUs to full product cards with:                             │
│    • Name, price, stock count                                           │
│    • Location (Aisle + Bin)                                             │
│    • Why it works for this use case                                     │
│    • Safety notes if applicable                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started - Deploy in 15 Minutes

### Prerequisites
- GitHub account
- Free accounts on: [Neon.tech](https://neon.tech), [Railway](https://railway.app), [Vercel](https://vercel.com)
- [Gemini API Key](https://aistudio.google.com/app/apikey) (FREE)

### Step 1: Database (Neon - FREE)

1. Go to https://neon.tech → Sign up
2. Create project "katzai"
3. Copy your connection string: `postgresql://user:pass@host/db?sslmode=require`

### Step 2: Deploy API (Railway)

1. Push this repo to GitHub
2. Go to https://railway.app → "New Project" → "Deploy from GitHub"
3. Select your KatzAI repo
4. Add environment variables:

```
DATABASE_URL=<your-neon-connection-string>
JWT_SECRET=<generate-32-char-random-string>
API_PORT=3001
API_HOST=0.0.0.0
LLM_PROVIDER=gemini
GEMINI_API_KEY=<your-gemini-key>
GEMINI_MODEL=gemini-2.0-flash
LOG_LEVEL=info
```

5. Railway will deploy automatically. Get your API URL (e.g., `https://katzai-api.up.railway.app`)

### Step 3: Deploy Frontend (Vercel - FREE)

1. Go to https://vercel.com → "New Project" → Import your GitHub repo
2. Set **Root Directory** to `apps/admin`
3. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your Railway API URL
4. Deploy!

### Step 4: Seed Database

In Railway dashboard → your service → "Shell":
```bash
cd apps/api
npx tsx prisma/seed.ts
```

### Login Credentials

| Role | Email | Password |
|------|-------|----------|
| Employee | employee@demo-store.com | Demo123! |
| Manager | manager@demo-store.com | Demo123! |

---

## 🎤 Voice Features

### Voice Input (Speech-to-Text)
- Click the **large microphone button** to start listening
- Speak your question naturally
- "Listening..." indicator shows when active
- Transcript appears in the input field
- Auto-sends when you pause speaking
- Works in Chrome, Edge, Safari (Web Speech API)

### Voice Output (Text-to-Speech)
- Toggle the **speaker icon** in the header
- When enabled (highlighted), AI reads responses aloud
- Uses browser's built-in SpeechSynthesis
- Toggle off for silent mode

### Browser Compatibility
| Browser | Voice Input | Voice Output |
|---------|-------------|--------------|
| Chrome | ✅ | ✅ |
| Edge | ✅ | ✅ |
| Safari | ✅ | ✅ |
| Firefox | ❌ | ✅ |

---

## 📦 Inventory Management

### CSV Import Format

Create a CSV file with your inventory:

```csv
sku,name,category,description,price_cents,stock,aisle,bin,tags,attributes_json
KTZ-001,Command Strips Large,Adhesives,Damage-free hanging strips,1199,24,Aisle 7,Bin A,adhesive|no-drill|removable,"{""no_drill"":true,""max_weight_lb"":24}"
KTZ-002,Heavy Duty Monkey Hooks,Hooks,No-tool picture hangers,899,15,Aisle 3,Bin B,hooks|no-drill|drywall,"{""no_drill"":true,""max_weight_lb"":35}"
```

### CSV Fields

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| sku | Yes | Unique product identifier | `KTZ-001` |
| name | Yes | Product name | `Command Strips Large` |
| category | Yes | Category for grouping | `Adhesives` |
| description | Yes | Full description | `Damage-free hanging...` |
| price_cents | Yes | Price in cents | `1199` = $11.99 |
| stock | Yes | Current inventory count | `24` |
| aisle | Yes | Store aisle location | `Aisle 7` |
| bin | No | Bin/shelf location | `Bin A` |
| tags | No | Pipe-separated search tags | `adhesive\|no-drill` |
| attributes_json | No | JSON with product attributes | `{"no_drill":true}` |

### Loading CSV Data

```bash
cd apps/api

# Place your CSV in prisma/seed-data/
# Then run:
npx tsx prisma/load-csv.ts
```

### Useful Product Attributes

```json
{
  "no_drill": true,
  "max_weight_lb": 24,
  "wall_types": ["painted_drywall", "tile", "glass"],
  "surface_prep": "clean with isopropyl",
  "removable": true,
  "requires_tools": false
}
```

---

## 🔧 API Reference

### Authentication

**Login:**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "employee@demo-store.com",
  "password": "Demo123!"
}
```

**Response:**
```json
{
  "token": "eyJhbG...",
  "user": {
    "id": "user_123",
    "name": "Demo Employee",
    "email": "employee@demo-store.com",
    "role": "EMPLOYEE"
  }
}
```

### Ask Assistant

**Request:**
```http
POST /assistant/ask
Authorization: Bearer <token>
Content-Type: application/json

{
  "transcript": "I need to hang a heavy mirror without drilling",
  "conversationId": null
}
```

**Response:**
```json
{
  "conversationId": "conv_abc123",
  "assistantMessage": "For hanging a heavy mirror without drilling, I'd recommend checking out these options from our inventory...",
  "recommendedItems": [
    {
      "sku": "MONKEY-HOOK-HD",
      "name": "Heavy Duty Monkey Hooks",
      "price": 8.99,
      "stock": 15,
      "location": "Aisle 3, Bin B",
      "whyItWorks": "Holds up to 35 lbs with minimal wall damage"
    }
  ]
}
```

### Inventory Search

**Request:**
```http
GET /inventory/search?q=hooks+no+drill
Authorization: Bearer <token>
```

**Response:**
```json
{
  "items": [
    {
      "sku": "MONKEY-HOOK-HD",
      "name": "Heavy Duty Monkey Hooks",
      "price": 8.99,
      "stock": 15,
      "aisle": "Aisle 3",
      "bin": "Bin B"
    }
  ]
}
```

### Cart Operations

```http
POST /carts                    # Create new cart
GET /carts/active              # Get user's active cart
POST /carts/:id/items          # Add item to cart
DELETE /carts/:id/items/:sku   # Remove item from cart
POST /carts/:id/clear          # Clear all items
```

---

## 🏬 Store Policies

Managers can configure AI behavior through store policies:

| Policy | Effect |
|--------|--------|
| `preferNoDamage` | AI prefers rental-friendly, no-drill options first |
| `preferNoTools` | AI prefers tool-free solutions |
| `suggestDrillingFirst` | Suggests drilling for heavy items as primary option |
| `safetyDisclaimers` | Adds safety notes for electrical/plumbing |
| `customInstructions` | Free-text instructions for the AI |

---

## 🧪 Demo Flow

1. **Login** as `employee@demo-store.com`
2. **Click the microphone** button
3. **Speak**: "A customer wants to hang a heavy picture without drilling holes"
4. **AI responds** with specific products from your inventory
5. **Products show**: name, price, stock count, and aisle/bin location
6. **Add to cart** for customer checkout

---

## 🛠️ Development Scripts

### API Server
```bash
cd apps/api
pnpm dev              # Start with hot reload
pnpm build            # Build for production
npx prisma studio     # Open database browser UI
npx prisma db push    # Push schema changes
npx prisma db seed    # Re-seed demo data
```

### Frontend
```bash
cd apps/admin
pnpm dev              # Start Next.js dev server
pnpm build            # Build for production
pnpm lint             # Run ESLint
```

---

## 🐛 Troubleshooting

### "Failed to fetch" on login
- Make sure API server is running: `cd apps/api && pnpm dev`
- Verify API is on port 3001: http://localhost:3001/health

### "AI not configured" or API errors
- Check `GEMINI_API_KEY` is set in `apps/api/.env`
- Restart the API server after adding the key

### "I'm experiencing a technical issue"
- Check API terminal for error logs
- Often caused by conversation history parsing issues
- Restart API server: kill process, run `pnpm dev` again

### "No matching products found" for every query
- Run the seed script: `cd apps/api && npx prisma db seed`
- Load CSV inventory: `npx tsx prisma/load-csv.ts`
- Verify inventory exists: `npx prisma studio` → InventoryItem table

### Voice input not working
- Use Chrome, Edge, or Safari (Firefox lacks Web Speech API)
- Allow microphone permissions when browser prompts
- Check browser console (F12) for errors

### Database issues
```bash
cd apps/api

# Reset everything and start fresh
rm dev.db
npx prisma db push
npx prisma db seed
```

---

## 🚢 Production Deployment

### Environment Variables

```env
# Use PostgreSQL for production
DATABASE_URL=postgresql://user:pass@host:5432/katzai

# Strong secret (generate with: openssl rand -base64 32)
JWT_SECRET=<random-32-character-string>

# Your Gemini key
GEMINI_API_KEY=<your-key>

# Production settings
NODE_ENV=production
LOG_LEVEL=info
```

### Deploy Options

- **Vercel** - Frontend (Next.js)
- **Railway/Render** - API (Fastify)
- **Neon** - PostgreSQL database (free tier)
- **Docker** - Self-hosted option

---

## 📊 Future Roadmap

### ✅ Phase 1 (Current)
- [x] Employee assistant UI
- [x] Voice input (Web Speech API)
- [x] Voice output (TTS)
- [x] Truth Mode validation
- [x] Manager dashboard
- [x] CSV inventory import
- [x] SQLite for easy development
- [x] Role-based routing (Employee → /employee, Manager → /dashboard)

### 🔜 Phase 2 (Next)
- [ ] Barcode scanning
- [ ] Multi-store support
- [ ] Real-time inventory sync
- [ ] Push-to-talk hardware button
- [ ] Offline mode with sync
- [ ] PostgreSQL migration script

### 🔮 Phase 3 (Future)
- [ ] React Native mobile app
- [ ] POS system integration
- [ ] Customer-facing kiosk mode
- [ ] Advanced analytics dashboard
- [ ] A/B testing for recommendations

---

## 📄 License

MIT License - Use freely for your retail AI needs.

---

## 🙏 Built With

- [Fastify](https://fastify.io/) - Fast Node.js web framework
- [Next.js](https://nextjs.org/) - React framework
- [Prisma](https://prisma.io/) - Database ORM
- [Google Gemini](https://ai.google.dev/) - FREE AI/LLM
- [TailwindCSS](https://tailwindcss.com/) - Utility-first CSS
- [Lucide Icons](https://lucide.dev/) - Beautiful icons

---

**Questions?** Open an issue or reach out!
