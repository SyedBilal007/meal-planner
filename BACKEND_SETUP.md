# 🔧 Backend Setup Guide

## Why Registration Fails

Your frontend is deployed on Vercel, but it's trying to connect to `http://localhost:3001/api` which doesn't exist in production. You need to:

1. **Deploy the backend server** (Railway, Render, Heroku, etc.)
2. **Configure the API URL** in Vercel environment variables

## 🚀 Quick Setup Options

### Option 1: Deploy Backend on Railway (Recommended - Easiest)

1. **Sign up at [Railway.app](https://railway.app)** (free tier available)

2. **Create New Project**:
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Connect your GitHub account
   - Select your `meal-planner` repository
   - Select the `server` folder as the root

3. **Add PostgreSQL Database**:
   - In Railway project, click "New"
   - Select "Database" → "PostgreSQL"
   - Railway will create a database automatically

4. **Set Environment Variables**:
   - Go to your service → "Variables"
   - Add these variables:
     ```
     DATABASE_URL=<Railway will provide this automatically>
     JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
     PORT=3001
     FRONTEND_URL=https://your-vercel-app.vercel.app
     OPENAI_API_KEY=your-openai-key (optional)
     ```

5. **Deploy**:
   - Railway will automatically detect it's a Node.js project
   - It will run `npm install` and `npm start`
   - Wait for deployment to complete

6. **Get Your Backend URL**:
   - Railway will give you a URL like: `https://your-app.up.railway.app`
   - Copy this URL

7. **Update Vercel Environment Variables**:
   - Go to Vercel dashboard → Your project → Settings → Environment Variables
   - Add: `VITE_API_URL` = `https://your-app.up.railway.app/api`
   - Redeploy your Vercel app

### Option 2: Deploy Backend on Render

1. **Sign up at [Render.com](https://render.com)** (free tier available)

2. **Create New Web Service**:
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Set:
     - **Root Directory**: `server`
     - **Build Command**: `npm install && npm run db:generate && npm run build`
     - **Start Command**: `npm start`
     - **Environment**: `Node`

3. **Add PostgreSQL Database**:
   - Click "New" → "PostgreSQL"
   - Render will create database

4. **Set Environment Variables**:
   ```
   DATABASE_URL=<Render provides this>
   JWT_SECRET=your-super-secret-jwt-key
   PORT=3001
   FRONTEND_URL=https://your-vercel-app.vercel.app
   NODE_ENV=production
   ```

5. **Deploy and get URL**, then update Vercel as above

### Option 3: Run Backend Locally (For Testing)

If you want to test locally first:

1. **Install Dependencies**:
   ```bash
   cd server
   npm install
   ```

2. **Set Up PostgreSQL**:
   - Install PostgreSQL locally, OR
   - Use a free service like [Supabase](https://supabase.com) or [Neon](https://neon.tech)

3. **Create `.env` file** in `server/` folder:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/mealsync"
   JWT_SECRET="your-secret-key"
   PORT=3001
   FRONTEND_URL="http://localhost:5173"
   OPENAI_API_KEY="your-key" # Optional
   ```

4. **Set Up Database**:
   ```bash
   npm run db:generate
   npm run db:push
   ```

5. **Start Server**:
   ```bash
   npm run dev
   ```

6. **Update Frontend**:
   - The frontend should automatically connect to `http://localhost:3001/api`
   - If running frontend locally: `npm run dev` in project root

## 🔍 Troubleshooting Registration

### Error: "Cannot connect to server"

**Cause**: Backend is not running or URL is wrong

**Solutions**:
1. Check if backend is deployed and running
2. Verify `VITE_API_URL` in Vercel environment variables
3. Check browser console (F12) for detailed error
4. Test backend URL directly: `https://your-backend.com/api/health`

### Error: "CORS Error"

**Cause**: Backend CORS not configured for your Vercel URL

**Solution**: Update `FRONTEND_URL` in backend environment to include your Vercel URL:
```
FRONTEND_URL=https://your-app.vercel.app
```

### Error: "Database connection failed"

**Cause**: Database URL is incorrect or database is not accessible

**Solution**: 
1. Verify `DATABASE_URL` in backend environment
2. Check database is running (if local)
3. Check database credentials

### Error: "User with this email already exists"

**Cause**: Email is already registered

**Solution**: Use a different email or login instead

## ✅ Verification Steps

1. **Check Backend Health**:
   - Visit: `https://your-backend-url.com/api/health`
   - Should return: `{"status":"ok","timestamp":"..."}`

2. **Check Frontend Config**:
   - Open browser console (F12)
   - Check Network tab when registering
   - See what URL it's trying to connect to

3. **Test Registration**:
   - Try registering with a new email
   - Check browser console for errors
   - Check backend logs for errors

## 📝 Quick Checklist

- [ ] Backend server deployed (Railway/Render/etc.)
- [ ] PostgreSQL database set up
- [ ] Environment variables configured in backend
- [ ] `VITE_API_URL` set in Vercel environment variables
- [ ] Vercel app redeployed after adding environment variable
- [ ] Backend health endpoint returns OK
- [ ] CORS configured correctly

## 🎯 Next Steps After Backend is Running

1. **Register a user** - Should work now!
2. **Create a household**
3. **Add meals**
4. **Test all features**

---

**Need help?** Check the error message in the browser console (F12) for more details!







