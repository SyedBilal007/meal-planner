import express from 'express';
import { authenticate } from '../utils/auth.js';
import { generateMealsFromIngredients } from '../utils/ai.js';
import { z } from 'zod';

const router = express.Router();

const generateMealsSchema = z.object({
  ingredients: z.array(z.string()).min(1),
});

// Generate meal suggestions from available ingredients
router.post('/generate-meals', authenticate, async (req, res) => {
  try {
    const data = generateMealsSchema.parse(req.body);

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ 
        error: 'AI service not configured',
        message: 'OpenAI API key is not set. Please configure OPENAI_API_KEY in environment variables.',
      });
    }

    const suggestions = await generateMealsFromIngredients(data.ingredients);

    res.json({
      suggestions,
      ingredients: data.ingredients,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Invalid input', details: error.errors });
    }
    
    console.error('AI generation error:', error);
    
    if (error instanceof Error && error.message.includes('OpenAI')) {
      return res.status(503).json({ 
        error: 'AI service unavailable',
        message: error.message,
      });
    }

    res.status(500).json({ 
      error: 'Failed to generate meal suggestions',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

