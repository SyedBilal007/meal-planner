/**
 * Minimal OpenAI client for the AI Meal Generator.
 *
 * NOTE: Set VITE_OPENAI_API_KEY in your .env.local (do not commit the key):
 * VITE_OPENAI_API_KEY=sk-...
 */

const OPENAI_MODEL = 'gpt-4.1-mini';

type GenerateMealPlanParams = {
  ingredients: string;
  dietaryPreferences?: string;
  days: number;
};

type OpenAIChatMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export async function generateMealPlanFromAI(params: GenerateMealPlanParams): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error('OpenAI API key is not configured (VITE_OPENAI_API_KEY).');
  }

  const { ingredients, dietaryPreferences, days } = params;

  const systemPrompt = `
You are an AI meal planner. Given available ingredients, dietary preferences, and a number of days,
suggest a simple, realistic meal plan.

Return your answer in a clean, human-readable Markdown format, grouped by day, and for each meal include:
- Meal name
- Which of the provided ingredients are used
- Very short instructions (2–4 steps max)
`.trim();

  const userPrompt = `
Available ingredients:
${ingredients}

Dietary preferences / restrictions:
${dietaryPreferences || 'None specified'}

Number of days to plan:
${days}

Please generate a meal plan for ${days} day(s).
`.trim();

  const body = {
    model: OPENAI_MODEL,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ] as OpenAIChatMessage[],
    temperature: 0.7,
  };

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('OpenAI error:', text);
    throw new Error('Failed to generate meal plan from AI');
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  return (content || 'No response from AI model.') as string;
}

