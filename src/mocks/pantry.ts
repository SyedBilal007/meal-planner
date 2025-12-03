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
  
  // Build clean updates object, converting null to undefined for optional fields
  const cleanUpdates: Partial<Omit<PantryItem, 'id' | 'created_at' | 'updated_at'>> = {};
  if (updates.name !== undefined) cleanUpdates.name = updates.name;
  if (updates.quantity !== undefined) {
    cleanUpdates.quantity = updates.quantity ?? undefined;
  }
  if (updates.unit !== undefined) {
    cleanUpdates.unit = updates.unit ?? undefined;
  }
  
  pantry[index] = {
    ...pantry[index],
    ...cleanUpdates,
    updated_at: new Date().toISOString(),
  };
  
  // Ensure the returned item never has null for optional fields
  const result = pantry[index];
  return {
    ...result,
    quantity: result.quantity ?? undefined,
    unit: result.unit ?? undefined,
  };
}

export async function mockDeletePantryItem(id: string): Promise<void> {
  await delay(200);
  pantry = pantry.filter((p) => p.id !== id);
}

