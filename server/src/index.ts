import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth.js';
import householdRoutes from './routes/household.js';
import mealRoutes from './routes/meal.js';
import recipeRoutes from './routes/recipe.js';
import groceryRoutes from './routes/grocery.js';
import shareRoutes from './routes/share.js';
import aiRoutes from './routes/ai.js';
import { setupSocketIO } from './utils/socket.js';
import { setSocketIO as setHouseholdSocketIO } from './routes/household.js';
import { setMealSocketIO } from './routes/meal.js';
import { setGrocerySocketIO } from './routes/grocery.js';

dotenv.config();

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Setup Socket.IO for real-time collaboration
setupSocketIO(io);

// Pass io instance to routes that need it
setHouseholdSocketIO(io);
setMealSocketIO(io);
setGrocerySocketIO(io);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/households', householdRoutes);
app.use('/api/meals', mealRoutes);
app.use('/api/recipes', recipeRoutes);
app.use('/api/grocery', groceryRoutes);
app.use('/api/share', shareRoutes);
app.use('/api/ai', aiRoutes);

const PORT = process.env.PORT || 3001;

httpServer.listen(PORT, () => {
  console.log(`🚀 MealSync server running on port ${PORT}`);
  console.log(`📡 Socket.IO ready for real-time updates`);
});

