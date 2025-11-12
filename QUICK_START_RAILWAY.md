# ⚡ Quick Start: Deploy Backend on Railway

## 🎯 5-Minute Setup

### 1️⃣ Sign Up & Create Project
- Go to **https://railway.app**
- Click **"New Project"** → **"Deploy from GitHub repo"**
- Select your **`meal-planner`** repository

### 2️⃣ Add Database
- Click **"+ New"** → **"Database"** → **"Add PostgreSQL"**
- Wait ~30 seconds for database to be created

### 3️⃣ Configure Service
- Click on your service
- **Settings** → Set **Root Directory** to: `server`
- **Variables** → Add these:

```
JWT_SECRET = (any random string, e.g., "my-secret-key-123")
PORT = 3001
FRONTEND_URL = https://your-vercel-app.vercel.app
NODE_ENV = production
```

- **Variables** → Click **"Add Reference"** → Select PostgreSQL → **DATABASE_URL**

### 4️⃣ Get Backend URL
- **Settings** → **Domains** → Copy the URL (e.g., `your-app.up.railway.app`)

### 5️⃣ Update Vercel
- Go to **Vercel Dashboard** → Your Project → **Settings** → **Environment Variables**
- Add: `VITE_API_URL` = `https://your-app.up.railway.app/api`
- **Redeploy** your Vercel app

### 6️⃣ Set Up Database
- Install Railway CLI: `npm i -g @railway/cli`
- Run:
  ```bash
  railway login
  railway link
  cd server
  railway run npm run db:push
  ```

### 7️⃣ Test!
- Go to your Vercel app
- Try registering a user
- Should work! 🎉

---

**Full detailed guide**: See `RAILWAY_DEPLOYMENT.md`

