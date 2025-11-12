import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface MealSuggestion {
  name: string;
  description: string;
  recipe?: {
    instructions: string;
    ingredients: Array<{ name: string; quantity: string; unit?: string }>;
  };
}

export const generateMealsFromIngredients = async (
  ingredients: string[]
): Promise<MealSuggestion[]> => {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OpenAI API key not configured');
  }

  const prompt = `Given these available ingredients: ${ingredients.join(', ')}

Suggest 3-5 meal options that can be made with these ingredients. For each meal, provide:
1. Meal name
2. Brief description
3. Recipe instructions (step-by-step)
4. List of ingredients needed (with quantities)

Format as JSON array with this structure:
[
  {
    "name": "Meal Name",
    "description": "Brief description",
    "recipe": {
      "instructions": "Step 1...\nStep 2...",
      "ingredients": [
        {"name": "ingredient1", "quantity": "amount", "unit": "unit"},
        {"name": "ingredient2", "quantity": "amount", "unit": "unit"}
      ]
    }
  }
]

Only suggest meals that can realistically be made with the provided ingredients.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a helpful cooking assistant. Provide meal suggestions in valid JSON format. Return a JSON object with a "meals" array containing meal objects.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(content);
    // Handle both { meals: [...] } and direct array formats
    if (Array.isArray(parsed)) {
      return parsed;
    }
    return parsed.meals || [];
  } catch (error) {
    console.error('AI generation error:', error);
    throw new Error('Failed to generate meal suggestions');
  }
};

