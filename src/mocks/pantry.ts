export type PantryItem = {
  id: string;
  name: string;
  quantity?: string;
  unit?: string;
  created_at?: string;
  updated_at?: string;
};

let pantry: PantryItem[] = [
  { id: '1', name: 'Onion', quantity: '2', unit: 'pcs' },
  { id: '2', name: 'Tomato', quantity: '3', unit: 'pcs' },
  { id: '3', name: 'Milk', quantity: '1', unit: 'L' },
  { id: '4', name: 'Chicken Breast', quantity: '500', unit: 'g' },
  { id: '5', name: 'Rice', quantity: '2', unit: 'kg' },
];

let nextId = 6;

// Simulate network delay
const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mockGetPantry(): Promise<PantryItem[]> {
  await delay(200);
  return [...pantry];
}

export async function mockAddPantryItem(
  item: Omit<PantryItem, 'id' | 'created_at' | 'updated_at'>
): Promise<PantryItem> {
  await delay(200);
  const newItem: PantryItem = {
    id: String(nextId++),
    ...item,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  pantry.push(newItem);
  return newItem;
}

export async function mockUpdatePantryItem(
  id: string,
  updates: Partial<Omit<PantryItem, 'id' | 'created_at' | 'updated_at'>>
): Promise<PantryItem | null> {
  await delay(200);
  const index = pantry.findIndex((p) => p.id === id);
  if (index === -1) return null;
  pantry[index] = {
    ...pantry[index],
    ...updates,
    updated_at: new Date().toISOString(),
  };
  return pantry[index];
}

export async function mockDeletePantryItem(id: string): Promise<void> {
  await delay(200);
  pantry = pantry.filter((p) => p.id !== id);
}

