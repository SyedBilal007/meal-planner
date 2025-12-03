import express from 'express';
import { prisma } from '../utils/prisma.js';
import { authenticate } from '../utils/auth.js';
import { z } from 'zod';

const router = express.Router();

const createRecipeSchema = z.object({
  name: z.string().min(1),
  instructions: z.string().optional(),
  servings: z.number().int().positive().optional(),
  cookingTime: z.number().int().positive().optional(),
  ingredients: z.array(z.object({
    name: z.string().min(1),
    quantity: z.string().optional(),
    unit: z.string().optional(),
  })).optional(),
});

// Get user's recipes
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const recipes = await prisma.recipe.findMany({
      where: { createdById: userId },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    res.json(recipes);
  } catch (error) {
    console.error('Get recipes error:', error);
    res.status(500).json({ error: 'Failed to fetch recipes' });
  }
});

// Get recipe by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const recipeId = req.params.id;
    const userId = req.user!.userId;

    const recipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!recipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    // Check if user owns the recipe (or make it shareable later)
    if (recipe.createdById !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(recipe);
  } catch (error) {
    console.error('Get recipe error:', error);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
});

// Create recipe
router.post('/', authenticate, async (req, res) => {
  try {
    const data = createRecipeSchema.parse(req.body);
    const userId = req.user!.userId;

    // Create recipe with ingredients
    const recipe = await prisma.recipe.create({
      data: {
        name: data.name,
        instructions: data.instructions,
        servings: data.servings,
        cookingTime: data.cookingTime,
        createdById: userId,
        ingredients: data.ingredients ? {
          create: await Promise.all(
            data.ingredients.map(async (ing) => {
              // Find or create ingredient
              let ingredient = await prisma.ingredient.findFirst({
                where: { name: ing.name.toLowerCase() },
              });

              if (!ingredient) {
                ingredient = await prisma.ingredient.create({
                  data: {
                    name: ing.name.toLowerCase(),
                    quantity: ing.quantity,
                    unit: ing.unit,
                  },
                });
              }

              return {
                ingredientId: ingredient.id,
                quantity: ing.quantity,
                unit: ing.unit,
              };
            })
          ),
        } : undefined,
      },
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    res.status(201).json(recipe);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Create recipe error:', error);
    res.status(500).json({ error: 'Failed to create recipe' });
  }
});

// Update recipe
router.put('/:id', authenticate, async (req, res) => {
  try {
    const recipeId = req.params.id;
    const userId = req.user!.userId;
    const data = createRecipeSchema.partial().parse(req.body);

    // Check ownership
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!existingRecipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    if (existingRecipe.createdById !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const updateData: any = {};
    if (data.name) updateData.name = data.name;
    if (data.instructions !== undefined) updateData.instructions = data.instructions;
    if (data.servings !== undefined) updateData.servings = data.servings;
    if (data.cookingTime !== undefined) updateData.cookingTime = data.cookingTime;

    const recipe = await prisma.recipe.update({
      where: { id: recipeId },
      data: updateData,
      include: {
        ingredients: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    res.json(recipe);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    console.error('Update recipe error:', error);
    res.status(500).json({ error: 'Failed to update recipe' });
  }
});

// Delete recipe
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const recipeId = req.params.id;
    const userId = req.user!.userId;

    // Check ownership
    const existingRecipe = await prisma.recipe.findUnique({
      where: { id: recipeId },
    });

    if (!existingRecipe) {
      return res.status(404).json({ error: 'Recipe not found' });
    }

    if (existingRecipe.createdById !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.recipe.delete({
      where: { id: recipeId },
    });

    res.json({ message: 'Recipe deleted successfully' });
  } catch (error) {
    console.error('Delete recipe error:', error);
    res.status(500).json({ error: 'Failed to delete recipe' });
  }
});

export default router;




