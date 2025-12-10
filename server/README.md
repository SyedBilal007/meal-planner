# MealSync Backend Server

Backend API server for MealSync - a collaborative meal planning application.

## Tech Stack

- **Runtime**: Node.js with TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.IO
- **Authentication**: JWT (JSON Web Tokens)
- **AI**: OpenAI API (for meal generation)

## Setup

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- OpenAI API key (optional, for AI features)

### Installation

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your configuration:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/mealsync?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
PORT=3001
FRONTEND_URL="http://localhost:5173"
OPENAI_API_KEY="your-openai-api-key"
```

3. Set up database:
```bash
# Generate Prisma client
npm run db:generate

# Push schema to database (for development)
npm run db:push

# Or run migrations (for production)
npm run db:migrate
```

4. Start development server:
```bash
npm run dev
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/me` - Get current user

### Households
- `POST /api/households` - Create household
- `GET /api/households` - Get user's households
- `GET /api/households/:id` - Get household by ID
- `POST /api/households/join` - Join household via invite code
- `DELETE /api/households/:id/leave` - Leave household

### Meals
- `GET /api/meals?householdId=...&startDate=...&endDate=...` - Get meals
- `POST /api/meals` - Create meal
- `PUT /api/meals/:id` - Update meal
- `DELETE /api/meals/:id` - Delete meal

### Recipes
- `GET /api/recipes` - Get user's recipes
- `GET /api/recipes/:id` - Get recipe by ID
- `POST /api/recipes` - Create recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe

### Grocery Lists
- `POST /api/grocery/generate` - Generate grocery list from meal plan
- `GET /api/grocery?householdId=...` - Get grocery lists
- `PATCH /api/grocery/items/:id/toggle` - Toggle item purchase status

### Sharing
- `POST /api/share` - Create shareable link
- `GET /api/share/:token` - Get shared meal plan (public)
- `DELETE /api/share/:token` - Deactivate share link

### AI
- `POST /api/ai/generate-meals` - Generate meal suggestions from ingredients

## Real-time Events (Socket.IO)

### Client → Server
- `join-household` - Join household room for updates
- `leave-household` - Leave household room

### Server → Client
- `meal-created` - New meal added
- `meal-updated` - Meal updated
- `meal-deleted` - Meal deleted
- `member-joined` - New member joined household
- `member-left` - Member left household
- `grocery-item-updated` - Grocery item purchase status changed

## Database Schema

See `prisma/schema.prisma` for the complete database schema.

Key entities:
- **User** - User accounts with authentication
- **Household** - Groups of users sharing meal plans
- **Meal** - Individual meals in the meal plan
- **Recipe** - Recipe definitions with ingredients
- **Ingredient** - Ingredient catalog
- **GroceryList** - Shopping lists generated from meals
- **MealPlanShare** - Public sharing links

## Development

```bash
# Run in development mode with hot reload
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Open Prisma Studio (database GUI)
npm run db:studio
```

## Production Deployment

1. Set `NODE_ENV=production`
2. Use a strong `JWT_SECRET`
3. Set up PostgreSQL database
4. Run migrations: `npm run db:migrate`
5. Build: `npm run build`
6. Start: `npm start`

## Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `JWT_SECRET` | Secret for JWT token signing | Yes |
| `PORT` | Server port | No (default: 3001) |
| `FRONTEND_URL` | Frontend URL for CORS | Yes |
| `OPENAI_API_KEY` | OpenAI API key for AI features | Optional |








