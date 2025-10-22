import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import MealPlanner from './components/MealPlanner.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MealPlanner />
  </StrictMode>,
)
