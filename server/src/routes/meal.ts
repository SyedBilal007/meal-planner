import express from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate } from '../utils/auth.js';
import { emitToHousehold } from '../utils/socket.js';
import { Server } from 'socket.io';
import { z } from 'zod';

const router = express.Router();

let io: Server | null = null;
export const setMealSocketIO = (socketIO: Server) => {
  io = socketIO;
};

const createMealSchema = z.object({
  name: z.string().min(1),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  date: z.string().datetime(),
  time: z.string().optional(),
  assignedToId: z.string().optional(),
  householdId: z.string(),
  recipeId: z.string().optional(),
});

const updateMealSchema = createMealSchema.partial();

// Get meals for household (with date range filter)
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const householdId = req.query.householdId as string;
    const startDate = req.query.startDate as string;
    const endDate = req.query.endDate as string;

    if (!householdId) {
      return res.status(400).json({ error: 'householdId is required' });
    }

    // Verify user is member
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId,
          householdId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const where: any = { householdId };
    if (startDate && endDate) {
      where.date = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const meals = await prisma.meal.findMany({
      where,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        recipe: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    res.json(meals);
  } catch (error) {
    console.error('Get meals error:', error);
    res.status(500).json({ error: 'Failed to fetch meals' });
  }
});

// Create meal
router.post('/', authenticate, async (req, res) => {
  try {
    const data = createMealSchema.parse(req.body);
    const userId = req.user!.userId;

    // Verify user is member of household
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId,
          householdId: data.householdId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const meal = await prisma.meal.create({
      data: {
        name: data.name,
        mealType: data.mealType,
        date: new Date(data.date),
        time: data.time,
        assignedToId: data.assignedToId,
        householdId: data.householdId,
        recipeId: data.recipeId,
      },
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        recipe: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Emit real-time update
    if (io) {
      emitToHousehold(io, data.householdId, 'meal-created', meal);
    }

    res.status(201).json(meal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create meal error:', error);
    res.status(500).json({ error: 'Failed to create meal' });
  }
});

// Update meal
router.put('/:id', authenticate, async (req, res) => {
  try {
    const mealId = req.params.id;
    const data = updateMealSchema.parse(req.body);
    const userId = req.user!.userId;

    // Get meal to check household access
    const existingMeal = await prisma.meal.findUnique({
      where: { id: mealId },
    });

    if (!existingMeal) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    // Verify user is member of household
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId,
          householdId: existingMeal.householdId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.mealType) updateData.mealType = data.mealType;
    if (data.date) updateData.date = new Date(data.date);
    if (data.time !== undefined) updateData.time = data.time;
    if (data.assignedToId !== undefined) updateData.assignedToId = data.assignedToId;
    if (data.recipeId !== undefined) updateData.recipeId = data.recipeId;

    const meal = await prisma.meal.update({
      where: { id: mealId },
      data: updateData,
      include: {
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        recipe: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Emit real-time update
    if (io) {
      emitToHousehold(io, existingMeal.householdId, 'meal-updated', meal);
    }

    res.json(meal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Update meal error:', error);
    res.status(500).json({ error: 'Failed to update meal' });
  }
});

// Delete meal
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const mealId = req.params.id;
    const userId = req.user!.userId;

    // Get meal to check household access
    const existingMeal = await prisma.meal.findUnique({
      where: { id: mealId },
    });

    if (!existingMeal) {
      return res.status(404).json({ error: 'Meal not found' });
    }

    // Verify user is member of household
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId,
          householdId: existingMeal.householdId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.meal.delete({
      where: { id: mealId },
    });

    // Emit real-time update
    if (io) {
      emitToHousehold(io, existingMeal.householdId, 'meal-deleted', { id: mealId });
    }

    res.json({ message: 'Meal deleted successfully' });
  } catch (error) {
    console.error('Delete meal error:', error);
    res.status(500).json({ error: 'Failed to delete meal' });
  }
});

export default router;







