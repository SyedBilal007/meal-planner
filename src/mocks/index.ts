// Mock data layer - easy to switch between mock and real API
// Import USE_MOCK_DATA from config/dataSource.ts

// Re-export all mock functions and types
export * from './pantry';
export * from './meals';
export * from './grocery';
export type { Meal } from './meals';
export type { GroceryItem } from './grocery';

// Re-export USE_MOCK_DATA from config for convenience
export { USE_MOCK_DATA } from '../config/dataSource';

