import express from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate } from '../utils/auth.js';
import { emitToHousehold } from '../utils/socket.js';
import { Server } from 'socket.io';
import { z } from 'zod';

const router = express.Router();

let io: Server | null = null;
export const setGrocerySocketIO = (socketIO: Server) => {
  io = socketIO;
};

const generateGroceryListSchema = z.object({
  householdId: z.string(),
  dateRangeStart: z.string().datetime(),
  dateRangeEnd: z.string().datetime(),
});

// Generate grocery list from meal plan
router.post('/generate', authenticate, async (req, res) => {
  try {
    const data = generateGroceryListSchema.parse(req.body);
    const userId = req.user!.userId;

    // Verify user is member
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

    // Get meals in date range
    const meals = await prisma.meal.findMany({
      where: {
        householdId: data.householdId,
        date: {
          gte: new Date(data.dateRangeStart),
          lte: new Date(data.dateRangeEnd),
        },
        recipe: {
          isNot: null,
        },
      },
      include: {
        recipe: {
          include: {
            ingredients: {
              include: {
                ingredient: true,
              },
            },
          },
        },
      },
    });

    // Consolidate ingredients
    const ingredientMap = new Map<string, { quantity: number; unit: string; name: string }>();

    meals.forEach(meal => {
      meal.recipe?.ingredients.forEach(ri => {
        const ing = ri.ingredient;
        const key = `${ing.name.toLowerCase()}_${ri.unit || ing.unit || ''}`;
        
        if (ingredientMap.has(key)) {
          const existing = ingredientMap.get(key)!;
          const qty = parseFloat(ri.quantity || ing.quantity || '1');
          existing.quantity += qty;
        } else {
          ingredientMap.set(key, {
            quantity: parseFloat(ri.quantity || ing.quantity || '1'),
            unit: ri.unit || ing.unit || '',
            name: ing.name,
          });
        }
      });
    });

    // Create new grocery list
    const newGroceryList = await prisma.groceryList.create({
      data: {
        householdId: data.householdId,
        dateRangeStart: new Date(data.dateRangeStart),
        dateRangeEnd: new Date(data.dateRangeEnd),
        items: {
          create: await Promise.all(
            Array.from(ingredientMap.entries()).map(async ([key, data]) => {
              let ing = await prisma.ingredient.findFirst({
                where: { name: data.name.toLowerCase() },
              });

              if (!ing) {
                ing = await prisma.ingredient.create({
                  data: {
                    name: data.name.toLowerCase(),
                    unit: data.unit,
                  },
                });
              }

              return {
                ingredientId: ing.id,
                quantity: data.quantity.toString(),
                unit: data.unit,
              };
            })
          ),
        },
      },
      include: {
        items: {
          include: {
            ingredient: true,
            purchasedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(201).json(newGroceryList);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Generate grocery list error:', error);
    res.status(500).json({ error: 'Failed to generate grocery list' });
  }
});

// Get grocery lists for household
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;
    const householdId = req.query.householdId as string;

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

    const groceryLists = await prisma.groceryList.findMany({
      where: { householdId },
      include: {
        items: {
          include: {
            ingredient: true,
            purchasedBy: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(groceryLists);
  } catch (error) {
    console.error('Get grocery lists error:', error);
    res.status(500).json({ error: 'Failed to fetch grocery lists' });
  }
});

// Toggle item purchase status
router.patch('/items/:id/toggle', authenticate, async (req, res) => {
  try {
    const itemId = req.params.id;
    const userId = req.user!.userId;

    const item = await prisma.groceryListItem.findUnique({
      where: { id: itemId },
      include: {
        groceryList: true,
      },
    });

    if (!item) {
      return res.status(404).json({ error: 'Item not found' });
    }

    // Verify user is member of household
    const membership = await prisma.householdMember.findUnique({
      where: {
        userId_householdId: {
          userId,
          householdId: item.groceryList.householdId,
        },
      },
    });

    if (!membership) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updatedItem = await prisma.groceryListItem.update({
      where: { id: itemId },
      data: {
        isPurchased: !item.isPurchased,
        purchasedById: !item.isPurchased ? userId : null,
        purchasedAt: !item.isPurchased ? new Date() : null,
      },
      include: {
        ingredient: true,
        purchasedBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Emit real-time update
    if (io) {
      emitToHousehold(io, item.groceryList.householdId, 'grocery-item-updated', updatedItem);
    }

    res.json(updatedItem);
  } catch (error) {
    console.error('Toggle item error:', error);
    res.status(500).json({ error: 'Failed to toggle item' });
  }
});

export default router;

