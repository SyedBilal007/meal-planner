export type GroceryItem = {
  id: number;
  name: string;
  quantity: string;
  unit: string;
  bought?: boolean;
};

let grocery: GroceryItem[] = [
  { id: 1, name: 'Onion', quantity: '4', unit: 'pcs', bought: false },
  { id: 2, name: 'Tomato', quantity: '6', unit: 'pcs', bought: false },
];

// let nextGroceryId = 3; // Reserved for future use if adding items

// Simulate network delay
const delay = (ms: number = 200) => new Promise((resolve) => setTimeout(resolve, ms));

export async function mockGetGrocery(): Promise<GroceryItem[]> {
  await delay(200);
  return [...grocery];
}

export async function mockToggleGroceryBought(
  id: number
): Promise<GroceryItem | null> {
  await delay(200);
  const index = grocery.findIndex((g) => g.id === id);
  if (index === -1) return null;
  grocery[index].bought = !grocery[index].bought;
  return grocery[index];
}

