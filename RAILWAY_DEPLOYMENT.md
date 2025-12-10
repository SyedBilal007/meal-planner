# 🚂 Railway Backend Deployment Guide

## Step-by-Step Instructions

### Step 1: Sign Up for Railway

1. Go to **https://railway.app**
2. Click **"Start a New Project"** or **"Login"**
3. Sign up with GitHub (recommended) or email
4. Complete the signup process

### Step 2: Create New Project

1. Once logged in, click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Authorize Railway to access your GitHub if prompted
4. Select your **`meal-planner`** repository
5. Railway will start importing your project

### Step 3: Add PostgreSQL Database

1. In your Railway project dashboard, click **"+ New"**
2. Select **"Database"**
3. Choose **"Add PostgreSQL"**
4. Railway will automatically create a PostgreSQL database
5. **Wait for it to provision** (takes ~30 seconds)

### Step 4: Configure Backend Service

1. In your Railway project, you should see your repository
2. Click on it to open service settings
3. Go to **"Settings"** tab
4. Set **"Root Directory"** to: `server`
5. Railway will auto-detect Node.js

### Step 5: Set Environment Variables

1. In your service, go to **"Variables"** tab
2. Click **"+ New Variable"**
3. Add these variables one by one:

   **Variable 1: DATABASE_URL**
   - Click **"Add Reference"** next to the PostgreSQL service
   - Select **"DATABASE_URL"**
   - This automatically links your database

   **Variable 2: JWT_SECRET**
   - Name: `JWT_SECRET`
   - Value: Generate a random string (you can use: `openssl rand -base64 32` or any random string)
   - Example: `my-super-secret-jwt-key-2024-change-this`

   **Variable 3: PORT**
   - Name: `PORT`
   - Value: `3001`

   **Variable 4: FRONTEND_URL**
   - Name: `FRONTEND_URL`
   - Value: Your Vercel URL (e.g., `https://your-app.vercel.app`)

   **Variable 5: NODE_ENV** (Optional but recommended)
   - Name: `NODE_ENV`
   - Value: `production`

   **Variable 6: OPENAI_API_KEY** (Optional - only if you want AI features)
   - Name: `OPENAI_API_KEY`
   - Value: Your OpenAI API key (get from https://platform.openai.com/api-keys)

### Step 6: Configure Build Settings

1. Go to **"Settings"** tab in your service
2. Under **"Build Command"**, Railway should auto-detect, but verify:
   - Build Command: `npm install && npm run db:generate`
   - Start Command: `npm start`
   - If not set, add them manually

### Step 7: Deploy

1. Railway will automatically start deploying
2. Watch the **"Deployments"** tab for progress
3. Wait for deployment to complete (usually 2-3 minutes)
4. Check the **"Logs"** tab if there are any errors

### Step 8: Get Your Backend URL

1. Once deployed, go to **"Settings"** tab
2. Scroll down to **"Domains"** section
3. Railway provides a default domain like: `your-service.up.railway.app`
4. **Copy this URL** (you'll need it for Vercel)

### Step 9: Set Up Database Schema

1. Go to **"Deployments"** tab
2. Click on the latest deployment
3. Open **"Logs"** tab
4. You should see the server starting

**Important**: We need to run database migrations. Railway doesn't automatically run them.

**Option A: Use Railway CLI (Recommended)**
1. Install Railway CLI: `npm i -g @railway/cli`
2. Login: `railway login`
3. Link project: `railway link` (select your project)
4. Run migrations:
   ```bash
   cd server
   railway run npm run db:push
   ```

**Option B: Use Railway's Web Terminal**
1. In Railway dashboard, go to your service
2. Click **"Deployments"** → **"View Logs"**
3. Click **"Shell"** or **"Terminal"** button
4. Run:
   ```bash
   cd server
   npm run db:push
   ```

### Step 10: Verify Backend is Working

1. Your backend URL should be: `https://your-service.up.railway.app`
2. Test the health endpoint: `https://your-service.up.railway.app/api/health`
3. You should see: `{"status":"ok","timestamp":"..."}`

### Step 11: Update Vercel Environment Variables

1. Go to **Vercel Dashboard**: https://vercel.com/dashboard
2. Select your **meal-planner** project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"**
5. Add:
   - **Name**: `VITE_API_URL`
   - **Value**: `https://your-service.up.railway.app/api`
   - **Environment**: Select all (Production, Preview, Development)
6. Click **"Save"**

### Step 12: Redeploy Vercel

1. In Vercel, go to **"Deployments"** tab
2. Click the **"..."** menu on the latest deployment
3. Select **"Redeploy"**
4. Or push a new commit to trigger redeploy

### Step 13: Test Registration

1. Go to your Vercel app URL
2. Try to register a new user
3. It should work now! 🎉

## 🔍 Troubleshooting

### Database Connection Error

**Problem**: Backend can't connect to database

**Solution**:
1. Check `DATABASE_URL` is set correctly (should be auto-linked)
2. Verify PostgreSQL service is running in Railway
3. Check backend logs for specific error

### Build Fails

**Problem**: Deployment fails during build

**Solution**:
1. Check **"Logs"** tab for error messages
2. Verify `Root Directory` is set to `server`
3. Make sure `package.json` exists in `server/` folder
4. Check that all dependencies are in `package.json`

### CORS Errors

**Problem**: Frontend can't connect due to CORS

**Solution**:
1. Verify `FRONTEND_URL` in Railway matches your Vercel URL exactly
2. Include protocol: `https://your-app.vercel.app` (not just domain)
3. Redeploy backend after changing `FRONTEND_URL`

### Database Schema Not Applied

**Problem**: Registration works but other features fail

**Solution**:
1. Make sure you ran `npm run db:push` (Step 9)
2. Check Railway logs for Prisma errors
3. Verify `DATABASE_URL` is correct

## ✅ Verification Checklist

- [ ] Railway account created
- [ ] Project created from GitHub repo
- [ ] PostgreSQL database added
- [ ] Root directory set to `server`
- [ ] All environment variables set
- [ ] Backend deployed successfully
- [ ] Database schema applied (`db:push` run)
- [ ] Health endpoint returns OK
- [ ] Backend URL copied
- [ ] `VITE_API_URL` added to Vercel
- [ ] Vercel app redeployed
- [ ] Registration works!

## 📝 Quick Reference

**Railway Dashboard**: https://railway.app/dashboard
**Vercel Dashboard**: https://vercel.com/dashboard

**Backend URL Format**: `https://your-service.up.railway.app`
**API Base URL**: `https://your-service.up.railway.app/api`

**Health Check**: `https://your-service.up.railway.app/api/health`

---

**Need help?** Check Railway logs or Vercel deployment logs for specific errors!








