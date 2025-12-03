# MealSync - Complete Setup Guide

## 🎯 Overview

MealSync is a collaborative meal planning application with the following features:
- User authentication and household management
- Collaborative meal planning
- AI-powered meal generation from available ingredients
- Real-time grocery list collaboration
- Recipe management
- Public sharing links

## 📁 Project Structure

```
meal-planner/
├── server/              # Backend API server
│   ├── prisma/         # Database schema
│   ├── src/
│   │   ├── routes/    # API route handlers
│   │   ├── utils/     # Utilities (auth, AI, socket)
│   │   └── index.ts   # Server entry point
│   └── package.json
├── src/                # Frontend React app
│   ├── components/    # React components
│   ├── contexts/      # React contexts (Auth)
│   ├── utils/         # Utilities (API client)
│   └── App.tsx        # Main app with routing
└── package.json
```

## 🚀 Backend Setup

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Set Up Database

Create a `.env` file in the `server` directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mealsync?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this"
PORT=3001
FRONTEND_URL="http://localhost:5173"
OPENAI_API_KEY="your-openai-api-key"  # Optional, for AI features
```

### 3. Initialize Database

```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (development)
npm run db:push

# Or create migration (production)
npm run db:migrate
```

### 4. Start Backend Server

```bash
npm run dev
```

Server will run on `http://localhost:3001`

## 🎨 Frontend Setup

### 1. Install Dependencies

```bash
# From project root
npm install
```

### 2. Configure Environment

Create a `.env` file in the project root:

```env
VITE_API_URL=http://localhost:3001/api
```

### 3. Start Development Server

```bash
npm run dev
```

Frontend will run on `http://localhost:5173`

## ✅ What's Implemented

### Backend (Complete)
- ✅ PostgreSQL database schema with Prisma
- ✅ User authentication (JWT)
- ✅ Household/group management
- ✅ Meal planning CRUD operations
- ✅ Recipe management
- ✅ Grocery list generation
- ✅ Real-time collaboration (Socket.IO)
- ✅ Public sharing links
- ✅ AI meal generation (OpenAI integration)

### Frontend (Partial)
- ✅ React Router setup
- ✅ Authentication pages (Login/Register)
- ✅ Protected routes
- ✅ API client with axios
- ✅ Auth context provider
- ⚠️ MealPlanner component still uses localStorage (needs backend integration)

## 🔄 Next Steps

### Frontend Integration Required

1. **Update MealPlanner Component**
   - Replace localStorage with API calls
   - Add household selection/creation UI
   - Integrate with backend meal API
   - Add real-time updates with Socket.IO client

2. **Add Household Management UI**
   - Create/join household interface
   - Display household members
   - Invite code sharing

3. **Add AI Meal Generation UI**
   - Input form for available ingredients
   - Display AI suggestions
   - Add selected meals to plan

4. **Add Real-time Collaboration**
   - Socket.IO client integration
   - Live updates for meals and grocery lists

5. **Add Recipe Management UI**
   - Create/edit recipes
   - Link recipes to meals

6. **Add Sharing Features**
   - Generate share links
   - Public view page for shared meal plans

## 🧪 Testing

### Backend API Testing

Test endpoints using curl or Postman:

```bash
# Register user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Create household (use token from login)
curl -X POST http://localhost:3001/api/households \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name":"My Household"}'
```

### Frontend Testing

1. Start both servers (backend and frontend)
2. Navigate to `http://localhost:5173`
3. Register a new account
4. Create or join a household
5. Start planning meals!

## 📚 API Documentation

See `server/README.md` for complete API documentation.

## 🔐 Security Notes

- Change `JWT_SECRET` in production
- Use strong passwords
- Enable HTTPS in production
- Set up CORS properly for production domains
- Validate all user inputs

## 🚢 Deployment

### Backend Deployment

1. Set up PostgreSQL database (e.g., Supabase, Railway, AWS RDS)
2. Set environment variables
3. Run migrations: `npm run db:migrate`
4. Deploy to hosting (e.g., Railway, Render, Heroku)

### Frontend Deployment

1. Build: `npm run build`
2. Deploy `dist/` folder to Vercel, Netlify, or similar
3. Set `VITE_API_URL` to your backend URL

## 🐛 Troubleshooting

### Database Connection Issues
- Verify PostgreSQL is running
- Check `DATABASE_URL` format
- Ensure database exists

### CORS Errors
- Verify `FRONTEND_URL` matches your frontend URL
- Check browser console for specific errors

### Authentication Issues
- Check JWT token in localStorage
- Verify token hasn't expired
- Check backend logs for errors

## 📝 License

[Your License Here]




