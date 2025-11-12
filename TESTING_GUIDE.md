# 🧪 MealSync Testing Guide

## ⚠️ Important Note

**The frontend is deployed on Vercel, but you need to set up the backend server separately for full functionality.**

The frontend will try to connect to `http://localhost:3001/api` by default. For production, you need to:
1. Deploy the backend server (Railway, Render, Heroku, etc.)
2. Update the `VITE_API_URL` environment variable in Vercel to point to your backend URL

## 🚀 Quick Test (Frontend Only - Limited Functionality)

### Step 1: Access the Application
1. Go to your Vercel deployment URL (e.g., `https://your-app.vercel.app`)
2. You should see the **Login** page

### Step 2: Register a New Account
1. Click **"Sign up"** link at the bottom
2. Fill in the registration form:
   - **Name** (optional): Your name
   - **Email**: `test@example.com` (or any email)
   - **Password**: `password123` (must be at least 6 characters)
3. Click **"Sign Up"**

**Note**: Registration will fail if the backend is not running. You'll see an error message.

### Step 3: Login (If Backend is Running)
1. Enter your email and password
2. Click **"Login"**

## 🔧 Full Testing (With Backend)

### Prerequisites
1. **Backend Server Running**: The backend must be deployed and accessible
2. **Database Set Up**: PostgreSQL database with Prisma schema applied
3. **Environment Variables**: Backend must have all required env vars

### Complete User Flow Test

#### 1. Registration & Login
```
✅ Navigate to login page
✅ Click "Sign up"
✅ Register with:
   - Email: test@example.com
   - Password: password123
   - Name: Test User
✅ Should redirect to main app after registration
✅ Logout and login again to verify login works
```

#### 2. Household Management
```
✅ See "No households yet" message
✅ Click "Create" button
✅ Create household: "My Test Household"
✅ Should see household appear with invite code
✅ Copy invite code
✅ In another browser/incognito, register new user
✅ Use "Join" button and paste invite code
✅ Should join household successfully
✅ Switch between households (if you have multiple)
```

#### 3. Meal Planning
```
✅ Select a day (e.g., Monday)
✅ Add meal:
   - Title: "Chicken Stir Fry"
   - Ingredients (optional): 
     * Chicken breast
     * Bell peppers
     * Broccoli
✅ Click "Add Meal"
✅ Should see meal appear in the list
✅ Delete a meal (click trash icon)
✅ Navigate to different week (Previous/Next buttons)
✅ Add meals to different days
```

#### 4. AI Meal Generation
```
✅ Click "AI Meal Generator" button
✅ Add ingredients:
   - chicken
   - tomatoes
   - rice
✅ Click "Generate Meal Suggestions"
✅ Should see AI-generated meal options
✅ Select a date and meal type
✅ Click "Add to Plan" on a suggestion
✅ Should add meal to your plan
```

**Note**: AI features require `OPENAI_API_KEY` to be set in backend environment.

#### 5. Grocery List
```
✅ Add several meals with ingredients
✅ Scroll down to "Grocery List" section
✅ Should see categorized grocery items:
   - Produce (vegetables, fruits)
   - Dairy (milk, cheese)
   - Pantry (rice, spices)
   - Protein (chicken, eggs)
   - etc.
✅ Click category headers to expand/collapse
✅ Toggle "Copy by category" checkbox
✅ Click "Copy List" - should copy to clipboard
✅ Click "Download" - should download text file
```

#### 6. Real-Time Collaboration
```
✅ Open app in two different browsers (or incognito windows)
✅ Login with different users in each
✅ Join the same household in both
✅ Add a meal in Browser 1
✅ Should see meal appear in Browser 2 automatically (real-time update)
✅ Delete a meal in Browser 1
✅ Should see it disappear in Browser 2
```

## 🐛 Troubleshooting

### "Failed to register" / "Failed to login"
- **Cause**: Backend server is not running or not accessible
- **Solution**: 
  1. Deploy backend server
  2. Update `VITE_API_URL` in Vercel environment variables
  3. Redeploy frontend

### "Network Error" / "CORS Error"
- **Cause**: Backend CORS not configured for your Vercel URL
- **Solution**: Update `FRONTEND_URL` in backend `.env` to include your Vercel URL

### "AI service not configured"
- **Cause**: `OPENAI_API_KEY` not set in backend
- **Solution**: Add OpenAI API key to backend environment variables (optional feature)

### Real-time updates not working
- **Cause**: Socket.IO connection failed
- **Solution**: 
  1. Check backend Socket.IO is running
  2. Verify WebSocket connection in browser console
  3. Check backend logs for Socket.IO errors

## 📝 Test Credentials (Create Your Own)

Since this is a new application, **there are no default credentials**. You must:

1. **Register first** - Create your own account
2. **Create household** - Set up your first household
3. **Invite others** - Share invite codes with flatmates

### Suggested Test Accounts

Create these accounts for testing:

**User 1:**
- Email: `user1@test.com`
- Password: `test123456`
- Name: `Test User 1`

**User 2:**
- Email: `user2@test.com`
- Password: `test123456`
- Name: `Test User 2`

Then:
1. User 1 creates a household
2. User 1 shares invite code with User 2
3. User 2 joins the household
4. Both users can now collaborate in real-time

## ✅ Testing Checklist

- [ ] Frontend loads on Vercel
- [ ] Registration page displays
- [ ] Can register new user (if backend running)
- [ ] Can login (if backend running)
- [ ] Can create household
- [ ] Can join household with invite code
- [ ] Can add meals to plan
- [ ] Can delete meals
- [ ] Can navigate between weeks
- [ ] AI meal generator works (if OpenAI key set)
- [ ] Grocery list generates correctly
- [ ] Grocery list categories work
- [ ] Copy/Download grocery list works
- [ ] Real-time updates work (test with 2 browsers)

## 🎯 Expected Behavior

### Without Backend
- ✅ Frontend loads
- ✅ Login/Register pages display
- ❌ Registration/Login will fail (expected)
- ❌ No data will load

### With Backend
- ✅ Full functionality works
- ✅ All features accessible
- ✅ Real-time collaboration works
- ✅ Data persists in database

## 📞 Next Steps

1. **Deploy Backend**: Set up backend server on Railway, Render, or similar
2. **Configure Environment**: Add backend URL to Vercel environment variables
3. **Test End-to-End**: Follow the complete testing flow above
4. **Invite Users**: Share your app with real users!

---

**Happy Testing! 🎉**

