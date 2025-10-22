import { describe, it, expect } from 'vitest'
import { parseIngredients, generateGroceryList, type WeekPlan } from './groceryList'

describe('parseIngredients', () => {
  it('should parse numeric ingredients with units', () => {
    const result = parseIngredients('2 kg potatoes\n1.5 cups flour')
    
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      id: 'flour|cups',
      name: 'flour',
      qty: 1.5,
      unit: 'cups'
    })
    expect(result[1]).toEqual({
      id: 'potatoes|kg',
      name: 'potatoes',
      qty: 2,
      unit: 'kg'
    })
  })

  it('should parse non-numeric ingredients', () => {
    const result = parseIngredients('salt\npepper\nonions')
    
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({
      id: 'onions',
      name: 'onions',
      qty: 1
    })
    expect(result[1]).toEqual({
      id: 'pepper',
      name: 'pepper',
      qty: 1
    })
    expect(result[2]).toEqual({
      id: 'salt',
      name: 'salt',
      qty: 1
    })
  })

  it('should merge quantities for same ingredient with same unit', () => {
    const result = parseIngredients('2 kg potatoes\n1 kg potatoes\n0.5 kg potatoes')
    
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      id: 'potatoes|kg',
      name: 'potatoes',
      qty: 3.5,
      unit: 'kg'
    })
  })

  it('should treat different units as separate items', () => {
    const result = parseIngredients('2 kg potatoes\n500 g potatoes')
    
    expect(result).toHaveLength(2)
    
    // Find items by their id since order might vary
    const gItem = result.find(item => item.id === 'potatoes|g')
    const kgItem = result.find(item => item.id === 'potatoes|kg')
    
    expect(gItem).toEqual({
      id: 'potatoes|g',
      name: 'potatoes',
      qty: 500,
      unit: 'g'
    })
    expect(kgItem).toEqual({
      id: 'potatoes|kg',
      name: 'potatoes',
      qty: 2,
      unit: 'kg'
    })
  })

  it('should handle case-insensitive ingredient names', () => {
    const result = parseIngredients('Chicken breast\nchicken breast\nCHICKEN BREAST')
    
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      id: 'chicken breast',
      name: 'chicken breast',
      qty: 3
    })
  })

  it('should count non-numeric duplicates', () => {
    const result = parseIngredients('salt\nsalt\nsalt')
    
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      id: 'salt',
      name: 'salt',
      qty: 3
    })
  })

  it('should handle mixed numeric and non-numeric ingredients', () => {
    const result = parseIngredients('2 kg potatoes\nsalt\n1.5 cups milk\nsalt')
    
    expect(result).toHaveLength(3)
    expect(result[0]).toEqual({
      id: 'milk|cups',
      name: 'milk',
      qty: 1.5,
      unit: 'cups'
    })
    expect(result[1]).toEqual({
      id: 'potatoes|kg',
      name: 'potatoes',
      qty: 2,
      unit: 'kg'
    })
    expect(result[2]).toEqual({
      id: 'salt',
      name: 'salt',
      qty: 2
    })
  })

  it('should handle ingredients without units', () => {
    const result = parseIngredients('3 eggs\n2 apples')
    
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      id: 'apples',
      name: 'apples',
      qty: 2
    })
    expect(result[1]).toEqual({
      id: 'eggs',
      name: 'eggs',
      qty: 3
    })
  })

  it('should ignore empty lines and trim whitespace', () => {
    const result = parseIngredients('  \n2 kg potatoes\n  \nsalt\n  ')
    
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      id: 'potatoes|kg',
      name: 'potatoes',
      qty: 2,
      unit: 'kg'
    })
    expect(result[1]).toEqual({
      id: 'salt',
      name: 'salt',
      qty: 1
    })
  })

  it('should handle decimal quantities', () => {
    const result = parseIngredients('1.5 cups flour\n2.25 kg sugar')
    
    expect(result).toHaveLength(2)
    expect(result[0]).toEqual({
      id: 'flour|cups',
      name: 'flour',
      qty: 1.5,
      unit: 'cups'
    })
    expect(result[1]).toEqual({
      id: 'sugar|kg',
      name: 'sugar',
      qty: 2.25,
      unit: 'kg'
    })
  })

  it('should return empty array for empty input', () => {
    const result = parseIngredients('')
    expect(result).toHaveLength(0)
  })

  it('should return empty array for whitespace only', () => {
    const result = parseIngredients('   \n  \n  ')
    expect(result).toHaveLength(0)
  })
})

describe('generateGroceryList', () => {
  it('should generate grocery list from weekly meal plan', () => {
    const weekPlan: WeekPlan = {
      Mon: [
        { id: '1', title: 'Breakfast', ingredients: '2 eggs\n1 cup milk' },
        { id: '2', title: 'Lunch', ingredients: '1 kg chicken\nsalt' }
      ],
      Tue: [
        { id: '3', title: 'Dinner', ingredients: '2 kg potatoes\n1 kg chicken' }
      ],
      Wed: [],
      Thu: [],
      Fri: [],
      Sat: [],
      Sun: []
    }

    const result = generateGroceryList(weekPlan)
    
    expect(result).toHaveLength(5)
    // Results are sorted alphabetically by name
    expect(result[0]).toEqual({
      id: 'chicken|kg',
      name: 'chicken',
      qty: 2,
      unit: 'kg'
    })
    expect(result[1]).toEqual({
      id: 'eggs',
      name: 'eggs',
      qty: 2
    })
    expect(result[2]).toEqual({
      id: 'milk|cup',
      name: 'milk',
      qty: 1,
      unit: 'cup'
    })
    expect(result[3]).toEqual({
      id: 'potatoes|kg',
      name: 'potatoes',
      qty: 2,
      unit: 'kg'
    })
    expect(result[4]).toEqual({
      id: 'salt',
      name: 'salt',
      qty: 1
    })
  })

  it('should handle empty meal plan', () => {
    const weekPlan: WeekPlan = {
      Mon: [],
      Tue: [],
      Wed: [],
      Thu: [],
      Fri: [],
      Sat: [],
      Sun: []
    }

    const result = generateGroceryList(weekPlan)
    expect(result).toHaveLength(0)
  })

  it('should merge ingredients across different days', () => {
    const weekPlan: WeekPlan = {
      Mon: [
        { id: '1', title: 'Meal 1', ingredients: '2 kg potatoes' }
      ],
      Tue: [
        { id: '2', title: 'Meal 2', ingredients: '1 kg potatoes' }
      ],
      Wed: [],
      Thu: [],
      Fri: [],
      Sat: [],
      Sun: []
    }

    const result = generateGroceryList(weekPlan)
    
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      id: 'potatoes|kg',
      name: 'potatoes',
      qty: 3,
      unit: 'kg'
    })
  })

  it('should handle meals with empty ingredients', () => {
    const weekPlan: WeekPlan = {
      Mon: [
        { id: '1', title: 'Meal 1', ingredients: '2 kg potatoes' },
        { id: '2', title: 'Meal 2', ingredients: '' }
      ],
      Tue: [],
      Wed: [],
      Thu: [],
      Fri: [],
      Sat: [],
      Sun: []
    }

    const result = generateGroceryList(weekPlan)
    
    expect(result).toHaveLength(1)
    expect(result[0]).toEqual({
      id: 'potatoes|kg',
      name: 'potatoes',
      qty: 2,
      unit: 'kg'
    })
  })
})
