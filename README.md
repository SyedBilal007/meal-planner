# 🍽️ Meal Planner & Grocery List

A modern, responsive meal planning application with intelligent grocery list generation. Plan your weekly meals and automatically generate organized shopping lists with smart ingredient parsing and quantity management.

## ✨ Features

### 🗓️ **Weekly Meal Planning**
- **7-day meal planner** with intuitive day selection
- **Add/remove meals** with title and ingredients
- **Real-time meal counting** per day
- **Persistent data storage** with localStorage
- **Reset functionality** with confirmation dialog

### 🛒 **Smart Grocery List Generation**
- **Intelligent ingredient parsing** with quantity and unit support
- **Automatic quantity summing** for duplicate ingredients
- **Case-insensitive matching** for ingredient names
- **Unit-aware grouping** (e.g., "kg" vs "g" treated separately)
- **Clean output formatting** for copy/download

### 🎨 **Modern UI/UX**
- **Responsive design** that works on all devices
- **Smooth animations** with Framer Motion
- **Accessible interface** with proper focus management
- **Beautiful empty states** with helpful guidance
- **Toast notifications** for user feedback

### ♿ **Accessibility**
- **Full keyboard navigation** support
- **Screen reader compatibility** with ARIA labels
- **Focus rings** on all interactive elements
- **Semantic HTML** structure
- **High contrast** color schemes

## 🛠️ Tech Stack

- **Frontend**: React 19 + TypeScript
- **Build Tool**: Vite 7
- **Styling**: Tailwind CSS 3
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Code Quality**: ESLint + Prettier
- **Testing**: Vitest (optional)

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/SyedBilal007/meal-planner.git
   cd meal-planner
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:5173` (or the port shown in terminal)

## 🚀 Deployment to Vercel

### Option 1: Deploy from GitHub (Recommended)

1. **Push your code to GitHub**
   ```bash
   git add .
   git commit -m "Prepare for Vercel deployment"
   git push origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with your GitHub account
   - Click "New Project"
   - Import your `meal-planner` repository
   - Vercel will automatically detect it's a Vite project
   - Click "Deploy"

3. **Automatic deployments**
   - Every push to `main` branch will trigger a new deployment
   - Preview deployments for pull requests

### Option 2: Deploy with Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy from project directory**
   ```bash
   cd meal-planner
   vercel
   ```

3. **Follow the prompts**
   - Link to existing project or create new one
   - Confirm build settings (auto-detected)
   - Deploy!

### Vercel Configuration

The project includes `vercel.json` for proper SPA routing:
```json
{
  "rewrites": [
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ]
}
```

This ensures the app works correctly when users refresh the page or navigate directly to URLs.

### Build Settings (Auto-detected by Vercel)
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

## 📜 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint for code quality |
| `npm run lint:fix` | Fix ESLint issues automatically |
| `npm run format` | Format code with Prettier |
| `npm run format:check` | Check code formatting |
| `npm test` | Run test suite (optional) |

## 🧪 Manual Test Checklist

### Core Functionality Tests

#### ✅ **1. Quantity Merging Test**
- Add meal with ingredients: `"2 kg potatoes"`
- Add another meal with: `"1 kg potatoes"`
- **Expected**: Grocery list shows `"3 potatoes (kg)"`

#### ✅ **2. Non-Numeric Counting Test**
- Add meal with ingredient: `"salt"`
- Add another meal with: `"salt"`
- **Expected**: Grocery list shows `"2 salt"`

#### ✅ **3. Data Persistence Test**
- Add several meals across different days
- Refresh the browser page
- **Expected**: All meals and data persist

#### ✅ **4. Reset Functionality Test**
- Add meals to multiple days
- Click "Reset All Plans" button
- Confirm the dialog
- **Expected**: All days cleared, meal counts reset to 0

#### ✅ **5. Copy/Download Output Test**
- Add meals with various ingredients
- Click "Copy List" button
- **Expected**: Clean bullet format copied to clipboard
- Click "Download" button
- **Expected**: Tab-separated text file downloaded

### Advanced Parsing Tests

#### ✅ **6. Unit Handling Test**
- Add: `"2 kg potatoes"` and `"500 g potatoes"`
- **Expected**: Two separate entries (different units)

#### ✅ **7. Case-Insensitive Test**
- Add: `"Chicken breast"` and `"chicken breast"`
- **Expected**: Combined as `"2 chicken breast"`

#### ✅ **8. Decimal Support Test**
- Add: `"1.5 cups flour"`
- **Expected**: Shows `"1.5 cups flour"`

#### ✅ **9. Mixed Format Test**
- Add: `"2 kg potatoes"`, `"salt"`, `"1.5 cups milk"`
- **Expected**: All parsed correctly with appropriate quantities

## 🏗️ Project Structure

```
meal-planner/
├── src/
│   ├── components/
│   │   └── MealPlanner.tsx    # Main application component
│   ├── utils/
│   │   └── groceryList.ts     # Pure utility functions
│   ├── main.tsx               # Application entry point
│   └── index.css              # Global styles
├── tests/
│   └── groceryList.test.ts    # Test suite
├── public/                    # Static assets
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.ts
└── README.md
```

## 🧪 Testing (Optional)

The project includes comprehensive tests for the grocery list parsing logic:

### Running Tests
```bash
npm test
```

### Test Coverage
- **Numeric parsing** with quantity and unit extraction
- **Quantity merging** for duplicate ingredients
- **Case-insensitive** ingredient matching
- **Unit-aware grouping** and separation
- **Non-numeric counting** for simple ingredients
- **Edge cases** and error handling

## 🎯 Key Features Explained

### Smart Ingredient Parsing
The app intelligently parses ingredients using these rules:

1. **Numeric lines**: `"2 kg potatoes"` → qty=2, unit="kg", name="potatoes"
2. **Non-numeric lines**: `"salt"` → qty=1, name="salt"
3. **Quantity summing**: Same name+unit combinations are automatically merged
4. **Case-insensitive**: "Potatoes" and "potatoes" are treated as the same
5. **Unit separation**: "kg" and "g" are treated as different units

### Data Persistence
- Uses `localStorage` with key `"meal-plan-v1"`
- Safe error handling for corrupted data
- Automatic saving on every change
- Graceful fallback to empty state

### Responsive Design
- **Mobile-first** approach with Tailwind CSS
- **Flexible layouts** that adapt to screen size
- **Touch-friendly** interactions
- **Readable typography** at all sizes

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -m 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with modern React and TypeScript
- Styled with Tailwind CSS
- Animated with Framer Motion
- Icons from Lucide React

---

**Happy meal planning! 🍽️✨**