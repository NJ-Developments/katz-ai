# 🚀 KatzAI Production Deployment Guide

## Quick Deploy (15 minutes)

### What You Need
1. **Neon.tech account** (FREE Postgres) - https://neon.tech
2. **Railway account** (API hosting, $5 free credit) - https://railway.app
3. **Vercel account** (Frontend, FREE) - https://vercel.com
4. **Gemini API Key** (FREE) - https://aistudio.google.com/app/apikey

---

## Step 1: Database (Neon - FREE)

1. Go to https://neon.tech and sign up
2. Create a new project called "katzai"
3. Copy the connection string (looks like `postgresql://user:pass@host/db?sslmode=require`)
4. Save it - you'll need it for Railway

---

## Step 2: API Server (Railway)

### Option A: Deploy via GitHub (Recommended)

1. Push your code to GitHub
2. Go to https://railway.app and sign up
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your KatzAI repo
5. Railway will auto-detect the Dockerfile

### Option B: Deploy via CLI

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Deploy
railway up
```

### Configure Environment Variables

In Railway dashboard, go to your service → Variables → Add these:

```
DATABASE_URL=postgresql://...your-neon-connection-string...
JWT_SECRET=generate-a-32-char-random-string
API_PORT=3001
API_HOST=0.0.0.0
LLM_PROVIDER=gemini
GEMINI_API_KEY=your-gemini-key
GEMINI_MODEL=gemini-2.0-flash
LOG_LEVEL=info
```

### Switch to Production Schema

Before deploying, rename the schema files:
```bash
cd apps/api/prisma
mv schema.prisma schema.sqlite.prisma
mv schema.production.prisma schema.prisma
```

### Get Your API URL

After deploy, Railway gives you a URL like `https://katzai-api-production.up.railway.app`

---

## Step 3: Frontend (Vercel - FREE)

1. Go to https://vercel.com and sign up with GitHub
2. Click "New Project" → Import your KatzAI repo
3. Set the **Root Directory** to `apps/admin`
4. Add environment variable:
   - `NEXT_PUBLIC_API_URL` = your Railway API URL (e.g., `https://katzai-api.up.railway.app`)
5. Click Deploy

---

## Step 4: Seed the Database

After Railway deploys, open the Railway shell:

```bash
# In Railway dashboard, click on your service → Shell
cd apps/api
npx prisma db push
npx prisma db seed
```

---

## Step 5: Test It!

1. Open your Vercel URL
2. Login with:
   - Employee: `employee@demo-store.com` / `Demo123!`
   - Manager: `manager@demo-store.com` / `Demo123!`
3. Try the AI assistant!

---

## Costs

| Service | Free Tier | Notes |
|---------|-----------|-------|
| Neon | 512MB storage, 1 project | Perfect for MVP |
| Railway | $5 credit/month | ~500 hours of running |
| Vercel | Unlimited deploys | Free for hobby projects |
| Gemini | 60 req/min | Generous free tier |

**Total: $0/month for light usage**

---

## Troubleshooting

### "Database connection failed"
- Check your Neon connection string ends with `?sslmode=require`
- Make sure you're using the production schema (postgresql, not sqlite)

### "Cannot find module"
- Run `npx prisma generate` before starting

### "AI not responding"
- Check GEMINI_API_KEY is set correctly
- Verify the model is `gemini-2.0-flash` (not `gemini-1.5-flash`)

### "CORS errors"
- Make sure `NEXT_PUBLIC_API_URL` matches your Railway URL exactly

---

## Custom Domain (Optional)

### Vercel
1. Go to Project Settings → Domains
2. Add your domain
3. Update DNS records

### Railway
1. Go to Service → Settings → Networking
2. Add custom domain
3. Update DNS records

---

## Need Help?

- Railway Docs: https://docs.railway.app
- Vercel Docs: https://vercel.com/docs
- Neon Docs: https://neon.tech/docs
