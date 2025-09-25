import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChefHat, Calendar, Utensils } from 'lucide-react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <div className="flex justify-center items-center gap-4 mb-8">
            <ChefHat className="w-12 h-12 text-indigo-600" />
            <h1 className="text-5xl font-bold text-gray-900">Meal Planner</h1>
            <Utensils className="w-12 h-12 text-indigo-600" />
          </div>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.6 }}
            className="text-xl text-gray-600 mb-12"
          >
            Plan your meals with ease using our modern meal planning app
          </motion.p>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="bg-white rounded-2xl shadow-xl p-8 max-w-md mx-auto"
          >
            <Calendar className="w-16 h-16 text-indigo-600 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">
              Welcome to Meal Planner
            </h2>
            <p className="text-gray-600 mb-6">
              Your journey to better meal planning starts here!
            </p>
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setCount((count) => count + 1)}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Get Started ({count})
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}

export default App
