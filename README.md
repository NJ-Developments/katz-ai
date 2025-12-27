# 🏪 KatzAI - Retail AI Assistant

> **AI-powered voice assistant for hardware retail employees. Ask questions naturally, get intelligent product recommendations from your actual inventory.**

[![Next.js](https://img.shields.io/badge/Next.js-16.1-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5.8-2D3748?logo=prisma)](https://www.prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?logo=tailwind-css)](https://tailwindcss.com/)

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Technical Analysis](#-technical-analysis)
- [Architecture](#-architecture)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Getting Started](#-getting-started)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Roadmap: Converting to Mobile App](#-roadmap-converting-to-mobile-app)
- [Roadmap: Converting to SaaS Platform](#-roadmap-converting-to-saas-platform)
- [Known Issues & Bugs](#-known-issues--bugs)
- [Recommended Improvements](#-recommended-improvements)
- [Contributing](#-contributing)

---

## 🎯 Overview

**KatzAI** is a full-stack AI-powered retail assistant application designed for hardware store employees. It leverages Google's Gemini AI to provide intelligent product recommendations based on actual store inventory. The application features:

- **Voice-First Interface**: Speech-to-text input and text-to-speech responses
- **Contextual AI**: AI understands conversation history for follow-up questions
- **Multi-Tenant Architecture**: Store-based data isolation
- **Role-Based Access**: Employee vs Manager dashboards
- **Real-Time Inventory**: AI recommendations based on live stock data

---

## 🔬 Technical Analysis

### What This Application Does

1. **Authentication Flow**:
   - JWT-based authentication using `jose` library
   - HTTP-only cookies for secure token storage
   - Role-based routing (Employees → Assistant, Managers → Dashboard)
   - 7-day token expiration

2. **AI Assistant Flow**:
   - User inputs query (voice or text)
   - Backend fetches in-stock products for user's store
   - Products are formatted into a context prompt
   - Gemini AI (gemma-3-27b-it model) generates contextual responses
   - AI includes suggested follow-up questions
   - Response is spoken aloud via Web Speech API

3. **Data Model**:
   - **Multi-tenant**: Stores → Users → Products relationship
   - **Store-scoped queries**: All data filtered by `storeId`
   - **Flexible attributes**: JSON strings for tags/attributes

4. **Voice Features**:
   - Continuous speech recognition with auto-restart
   - Real-time interim transcript display
   - Text-to-speech for AI responses
   - Mic/speaker toggle controls

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT (Next.js)                        │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Login Page  │  │  Assistant   │  │    Dashboard         │   │
│  │  (page.tsx)  │  │  (Voice UI)  │  │    (Manager View)    │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
│         │                 │                     │                │
│         ▼                 ▼                     ▼                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    API Routes (/api)                        │ │
│  │  ┌────────────┐  ┌──────────────┐  ┌────────────────────┐  │ │
│  │  │ /auth/     │  │ /assistant   │  │    /inventory      │  │ │
│  │  │ login      │  │ (AI Query)   │  │    (CRUD)          │  │ │
│  │  │ logout     │  │              │  │                    │  │ │
│  │  └────────────┘  └──────────────┘  └────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                  │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────┐  │
│  │   Prisma    │    │    Auth     │    │    Gemini AI        │  │
│  │   (ORM)     │◄──►│   (JWT)     │    │    (LLM)            │  │
│  └─────────────┘    └─────────────┘    └─────────────────────┘  │
│         │                                        │               │
│         ▼                                        ▼               │
│  ┌─────────────┐                      ┌─────────────────────┐   │
│  │ PostgreSQL  │                      │  Google AI Studio   │   │
│  │ (Neon.tech) │                      │  (Gemini API)       │   │
│  └─────────────┘                      └─────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## ✨ Features

### Current Features

| Feature | Description | Status |
|---------|-------------|--------|
| 🎤 Voice Input | Speech-to-text via Web Speech API | ✅ Complete |
| 🔊 Voice Output | Text-to-speech for AI responses | ✅ Complete |
| 🤖 AI Chat | Context-aware product recommendations | ✅ Complete |
| 🔐 Authentication | JWT-based login with cookies | ✅ Complete |
| 👥 Role-Based Access | Employee/Manager/Admin roles | ✅ Complete |
| 📦 Inventory View | Product management dashboard | ✅ Complete |
| 📊 Analytics | Basic inventory statistics | ✅ Complete |
| 📱 Responsive | Mobile-friendly UI | ✅ Complete |
| 🏪 Multi-Tenant | Store-scoped data isolation | ✅ Complete |

### Planned Features (Not Yet Implemented)

| Feature | Status |
|---------|--------|
| 👥 Team Management | 🔜 Coming Soon |
| ⚙️ Settings | 🔜 Coming Soon |
| ➕ Add/Edit/Delete Products | ⚠️ UI exists, no backend |
| 📈 Advanced Analytics | 🔜 Coming Soon |

---

## 🛠 Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Framework** | Next.js 16.1 | Full-stack React framework |
| **Language** | TypeScript 5.3 | Type-safe JavaScript |
| **Database** | PostgreSQL (Neon) | Cloud-native serverless Postgres |
| **ORM** | Prisma 5.8 | Type-safe database queries |
| **AI** | Google Gemini (gemma-3-27b-it) | Large Language Model |
| **Auth** | jose (JWT) | JSON Web Token handling |
| **Styling** | Tailwind CSS 3.4 | Utility-first CSS |
| **Icons** | Lucide React | Beautiful icons |
| **Validation** | Zod | Schema validation |
| **Hosting** | Vercel | Serverless deployment |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- pnpm, npm, or yarn
- PostgreSQL database (Neon.tech recommended)
- Google AI Studio API key

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/katzai.git
cd katzai
pnpm install
```

### 2. Environment Setup

Create `.env.local`:

```env
DATABASE_URL="postgresql://user:pass@host/db?sslmode=require"
JWT_SECRET="your-32-character-secret-key-here!"
GEMINI_API_KEY="your-gemini-api-key"
```

### 3. Database Setup

```bash
# Push schema to database
npx prisma db push

# Seed demo data
pnpm run db:seed
```

### 4. Run Development Server

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Employee | employee@demo-store.com | Demo123! |
| Manager | manager@demo-store.com | Demo123! |

### Deploy to Vercel

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import repo
3. Add environment variables:
   - `DATABASE_URL` = your Neon connection string
   - `JWT_SECRET` = any 32+ character string
   - `GEMINI_API_KEY` = your Gemini key
4. Deploy!

---

## 📡 API Documentation

### Authentication

#### POST `/api/auth/login`
```json
// Request
{ "email": "user@example.com", "password": "password" }

// Response (200)
{ "user": { "id": "...", "email": "...", "name": "...", "role": "EMPLOYEE" } }
// Sets HTTP-only cookie: token
```

#### POST `/api/auth/logout`
```json
// Response (200)
{ "success": true }
// Clears token cookie
```

### AI Assistant

#### POST `/api/assistant`
```json
// Request
{
  "question": "I need to hang a heavy mirror",
  "conversationHistory": [
    { "role": "user", "content": "previous question" },
    { "role": "assistant", "content": "previous response" }
  ]
}

// Response (200)
{
  "response": "For a heavy mirror, I recommend...",
  "suggestedQuestions": ["What weight?", "Do you have a drill?", "Is this drywall?"]
}
```

### Inventory

#### GET `/api/inventory`
```json
// Response (200)
{
  "products": [...],
  "user": { "id": "...", "name": "...", "email": "...", "role": "..." }
}
```

---

## 📁 Project Structure

```
KatzAI/
├── app/
│   ├── page.tsx                 # Login page (root)
│   ├── layout.tsx               # Root layout with metadata
│   ├── globals.css              # Tailwind imports
│   ├── assistant/
│   │   └── page.tsx             # Voice chat interface (426 lines)
│   ├── dashboard/
│   │   └── page.tsx             # Manager dashboard (290 lines)
│   ├── components/
│   │   ├── Navbar.tsx           # Responsive navigation
│   │   └── Footer.tsx           # Footer component
│   └── api/
│       ├── auth/
│       │   ├── login/route.ts   # Login endpoint
│       │   └── logout/route.ts  # Logout endpoint
│       ├── assistant/route.ts   # AI query endpoint
│       └── inventory/route.ts   # Product data endpoint
├── lib/
│   ├── db.ts                    # Prisma client singleton
│   ├── auth.ts                  # JWT utilities (create/verify)
│   └── ai.ts                    # Gemini AI integration
├── prisma/
│   ├── schema.prisma            # Database schema
│   └── seed.ts                  # Demo data seeder
├── types/
│   └── speech.d.ts              # Web Speech API types
├── package.json
├── tsconfig.json
├── tailwind.config.js
├── next.config.js
└── vercel.json
```

---

## 📱 Roadmap: Converting to Mobile App

### Option 1: React Native (Recommended)

**Timeline: 4-6 weeks**

#### Week 1: Project Setup
```bash
npx create-expo-app KatzAI-Mobile --template expo-template-blank-typescript
```
- Set up navigation (React Navigation)
- Configure API client (axios/fetch)
- Set up secure storage for tokens

#### Week 2: Authentication
- Implement login screen
- Use `expo-secure-store` for JWT storage
- Add biometric authentication option

#### Week 3: Voice Assistant
- Use `expo-speech` for text-to-speech
- Use `@react-native-voice/voice` for speech recognition
- Port chat UI to React Native components

#### Week 4: Dashboard & Polish
- Implement product listing
- Add pull-to-refresh
- Offline support with AsyncStorage
- Push notifications

#### Week 5-6: Testing & Deployment
- iOS TestFlight / Android Play Store beta
- Performance optimization
- App Store submission

### Option 2: PWA Enhancement

**Timeline: 1-2 weeks**

Add Progressive Web App capabilities to the existing Next.js app:

```bash
npm install next-pwa
```

```js
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
})
module.exports = withPWA({ /* existing config */ })
```

Create `public/manifest.json`:
```json
{
  "name": "KatzAI",
  "short_name": "KatzAI",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#3B82F6",
  "background_color": "#F9FAFB",
  "icons": [...]
}
```

### Option 3: Capacitor (Hybrid)

**Timeline: 2-3 weeks**

Wrap the Next.js app in native containers:

```bash
npm install @capacitor/core @capacitor/cli
npx cap init
npx cap add ios
npx cap add android
npx cap sync
```

---

## 💼 Roadmap: Converting to SaaS Platform

### Phase 1: Multi-Tenancy Foundation (2-3 weeks)

#### 1. Store Registration Flow
```typescript
// New API: POST /api/stores/register
// - Store name, slug, owner details
// - Auto-create admin user
// - Generate store-specific subdomain
```

#### 2. Subdomain Routing
```typescript
// middleware.ts
import { NextRequest, NextResponse } from 'next/server'

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host')
  const subdomain = hostname?.split('.')[0]
  
  // Route to store-specific data
  if (subdomain && subdomain !== 'www' && subdomain !== 'app') {
    // Rewrite to include store slug
    return NextResponse.rewrite(new URL(`/${subdomain}${request.nextUrl.pathname}`, request.url))
  }
}
```

#### 3. Enhanced Database Schema
```prisma
model Store {
  id               String   @id @default(cuid())
  name             String
  slug             String   @unique
  plan             Plan     @default(FREE)
  stripeCustomerId String?
  subscriptionId   String?
  aiQueriesUsed    Int      @default(0)
  aiQueriesLimit   Int      @default(100)
  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  users            User[]
  products         Product[]
  conversations    Conversation[]
}

enum Plan {
  FREE
  STARTER
  PROFESSIONAL
  ENTERPRISE
}
```

### Phase 2: Billing & Subscriptions (2-3 weeks)

#### 1. Stripe Integration
```bash
npm install stripe @stripe/stripe-js
```

#### 2. Pricing Tiers

| Plan | Price | Features |
|------|-------|----------|
| Free | $0/mo | 1 user, 50 products, 100 AI queries/mo |
| Starter | $29/mo | 5 users, 500 products, 1,000 queries/mo |
| Professional | $99/mo | 25 users, unlimited products, 10,000 queries/mo |
| Enterprise | Custom | SSO, API access, dedicated support, custom AI training |

#### 3. New API Endpoints
```
POST /api/billing/create-checkout-session
POST /api/billing/webhook (Stripe webhooks)
GET  /api/billing/subscription
POST /api/billing/cancel
```

### Phase 3: Admin & Analytics (2-3 weeks)

#### 1. Super Admin Dashboard
- All stores overview
- Revenue metrics (MRR, churn)
- User activity monitoring
- System health

#### 2. Store Admin Features
- Team management (invite, remove, roles)
- Permissions matrix
- Audit logs
- Usage analytics

#### 3. Enhanced Analytics
```typescript
// Track AI query performance
model AIQueryLog {
  id           String   @id @default(cuid())
  storeId      String
  userId       String
  question     String
  responseTime Int      // ms
  tokensUsed   Int
  createdAt    DateTime @default(now())
}
```

### Phase 4: API & Integrations (2-4 weeks)

#### 1. Public REST API
```
Authorization: Bearer <api_key>

GET  /api/v1/products
POST /api/v1/products
PUT  /api/v1/products/:id
DELETE /api/v1/products/:id
POST /api/v1/ai/query
GET  /api/v1/analytics
```

#### 2. Webhooks
```typescript
// Store owners can register webhook URLs for events:
- product.created
- product.updated
- inventory.low_stock
- ai.query.completed
```

#### 3. Third-Party Integrations
- **POS**: Square, Clover, Toast
- **E-commerce**: Shopify, WooCommerce
- **Accounting**: QuickBooks, Xero
- **Communication**: Slack, Discord

### Phase 5: Enterprise Features (4-6 weeks)

1. **SSO (SAML/OIDC)** - Okta, Azure AD, Google Workspace
2. **Custom AI Training** - Fine-tune on store-specific data
3. **White-labeling** - Custom branding, domains
4. **On-Premise** - Self-hosted deployment option
5. **SLA & Support** - 99.9% uptime guarantee, dedicated support

---

## 🐛 Known Issues & Bugs

### 🔴 Critical Issues

| Issue | Description | Impact | Fix Priority |
|-------|-------------|--------|--------------|
| **Missing Product CRUD** | Dashboard has Edit/Delete buttons but no API endpoints | Cannot modify products | HIGH |
| **No Input Validation** | AI assistant accepts any input without sanitization | Potential prompt injection | HIGH |
| **Default JWT Secret** | Hardcoded fallback secret in `auth.ts` | Security vulnerability in production | **CRITICAL** |

### 🟠 Medium Issues

| Issue | Description | Recommendation |
|-------|-------------|----------------|
| Missing `.env.example` | Referenced in README but file doesn't exist | Create template file |
| No Error Boundaries | React errors crash entire app | Add error boundaries |
| No Loading States | Some async operations lack feedback | Add skeleton loaders |
| Speech API Browser Support | Only works in Chrome/Edge | Add fallback or browser warning |
| No Rate Limiting | API endpoints vulnerable to abuse | Add rate limiting middleware |
| No Request Validation | API doesn't validate request bodies with Zod | Add schema validation |

### 🟡 Minor Issues

| Issue | Description |
|-------|-------------|
| Console Warnings | React hydration warnings in development |
| Unused Imports | `clsx` package installed but rarely used |
| Unused Component | `Footer.tsx` exists but isn't rendered anywhere |
| No 404 Page | Missing custom not-found page |

---

## 🚀 Recommended Improvements

### Security Improvements

#### 1. Remove Default JWT Secret (CRITICAL)
```typescript
// lib/auth.ts - BEFORE (vulnerable)
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'katzai-secret-key-32-chars-long!'
)

// AFTER (secure)
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}
const JWT_SECRET = new TextEncoder().encode(process.env.JWT_SECRET)
```

#### 2. Add Rate Limiting
```bash
npm install @upstash/ratelimit @upstash/redis
```
```typescript
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '60 s'),
})

// In API route
const { success, limit, remaining } = await ratelimit.limit(userId)
if (!success) {
  return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
}
```

#### 3. Add Input Validation
```typescript
import { z } from 'zod'

const querySchema = z.object({
  question: z.string().min(1).max(500).trim(),
  conversationHistory: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string().max(2000)
  })).max(10).optional()
})

// In API route
const parsed = querySchema.safeParse(await request.json())
if (!parsed.success) {
  return NextResponse.json({ error: parsed.error.message }, { status: 400 })
}
```

### Performance Improvements

#### 1. Add Database Indexes
```prisma
model Product {
  // ... existing fields

  @@index([storeId, category])
  @@index([storeId, stock])
  @@index([storeId, name])
}
```

#### 2. Implement Caching
```typescript
// Use Vercel KV or Redis for caching
import { kv } from '@vercel/kv'

const cacheKey = `products:${storeId}`
let products = await kv.get(cacheKey)

if (!products) {
  products = await prisma.product.findMany({ where: { storeId } })
  await kv.set(cacheKey, products, { ex: 300 }) // 5 min TTL
}
```

#### 3. Streaming AI Responses
```typescript
// Use streaming for faster perceived response
import { GoogleGenerativeAI } from '@google/generative-ai'

const result = await model.generateContentStream(prompt)
for await (const chunk of result.stream) {
  // Stream to client via SSE or WebSocket
}
```

### Feature Improvements

#### 1. Add Product CRUD Endpoints
```typescript
// POST /api/inventory - Create product
// PUT /api/inventory/[id] - Update product  
// DELETE /api/inventory/[id] - Delete product
```

#### 2. Conversation History Persistence
```prisma
model Conversation {
  id        String   @id @default(cuid())
  userId    String
  title     String?
  messages  Json     // Array of {role, content, timestamp}
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  user      User     @relation(fields: [userId], references: [id])
}
```

#### 3. Create `.env.example`
```env
# Database
DATABASE_URL="postgresql://user:password@host:5432/database?sslmode=require"

# Authentication
JWT_SECRET="generate-a-secure-32-character-secret"

# AI
GEMINI_API_KEY="your-google-ai-studio-api-key"
```

---

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Development Guidelines

- Follow TypeScript strict mode
- Use Prettier for formatting
- Write meaningful commit messages
- Add tests for new features
- Update documentation

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Google Gemini](https://ai.google.dev/) for AI capabilities
- [Vercel](https://vercel.com) for hosting
- [Neon](https://neon.tech) for serverless PostgreSQL
- [Prisma](https://prisma.io) for database tooling
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Lucide](https://lucide.dev) for beautiful icons

---

<div align="center">
  <p>Built with ❤️ by the KatzAI Team</p>
  <p>© 2025 KatzAI. All rights reserved.</p>
</div>
