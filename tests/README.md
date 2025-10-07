# Question API Testing Guide

This directory contains test cases for the Questions functionality in the TourEase backend.

## 📋 Test Coverage

The test suite includes **10 comprehensive test cases**:

1. **Get All Questions** - Tests pagination and sorting (Public)
2. **Get Question by ID** - Tests retrieving specific question with comments (Public)
3. **Create New Question** - Tests question creation (Requires Auth)
4. **Update Question** - Tests updating existing question (Requires Auth)
5. **Search Questions** - Tests keyword search functionality (Public)
6. **Search by Tag** - Tests tag-based filtering (Public)
7. **Upvote Question** - Tests upvoting functionality (Requires Auth)
8. **Downvote Question** - Tests downvoting functionality (Requires Auth)
9. **Ask AI** - Tests AI travel advice integration (Public)
10. **Delete Question** - Tests question deletion (Requires Auth)

## 🚀 Setup Instructions

### Step 1: Install Dependencies

```bash
cd tour_ease_backend
npm install axios
```

### Step 2: Get a Valid JWT Token

You need a JWT token for a user with the "traveler" role. You can get this by:

**Option A: Login via your frontend/Postman**
1. Login with a traveler account
2. Copy the JWT token from the response

**Option B: Generate using Firebase Admin (if you have user UID)**
```javascript
// In your backend, temporarily add this endpoint or use it in a script
const admin = require('firebase-admin');
const customToken = await admin.auth().createCustomToken('USER_UID');
// Then exchange this for an ID token via Firebase Auth
```

**Option C: Use an existing valid token from browser**
1. Login to your frontend
2. Open browser DevTools → Application → Local Storage
3. Look for the auth token

### Step 3: Configure the Test File

Open `tests/question.test.js` and update these values:

```javascript
// Line 17: Replace with your actual JWT token
const HARDCODED_JWT_TOKEN = 'eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...';

// Line 20: Update if your server runs on a different port
const BASE_URL = 'http://localhost:3000/api';

// Line 23: Replace with an actual question ID from your database
let EXISTING_QUESTION_ID = 1;
```

### Step 4: Ensure Your Server is Running

```bash
# In the tour_ease_backend directory
npm run dev
```

### Step 5: Run the Tests

```bash
# From the tour_ease_backend directory
node tests/question.test.js
```

## 📊 Understanding the Output

The test will output:
- ✅ **PASSED** - Test succeeded
- ❌ **FAILED** - Test failed (with error details)
- **Summary** - Total passed/failed and success rate

Example output:
```
============================================================
Test 1: Get All Questions with Pagination
============================================================
   Retrieved 5 questions
✅ PASSED: Get All Questions

============================================================
TEST SUMMARY
============================================================
✅ Passed: 8
❌ Failed: 2
📊 Total: 10
📈 Success Rate: 80.00%
============================================================
```

## 🔧 Troubleshooting

### Common Issues:

**1. "YOUR_JWT_TOKEN_HERE" error**
- You forgot to replace the hardcoded JWT token
- Solution: Update `HARDCODED_JWT_TOKEN` with a real token

**2. Connection refused / ECONNREFUSED**
- Your backend server is not running
- Solution: Run `npm run dev` in the backend directory

**3. 401 Unauthorized errors**
- Your JWT token is invalid or expired
- Solution: Generate a new JWT token

**4. 404 errors on test 2, 7, 8**
- The `EXISTING_QUESTION_ID` doesn't exist in your database
- Solution: Check your database for a valid question ID and update the constant

**5. Database errors**
- Your database is not set up or not running
- Solution: Run `npm run prisma:migrate` and ensure your database is running

## 🧹 Cleanup

Some tests create data in your database. After running tests:

1. Check the output for created question IDs
2. You can delete them manually through Prisma Studio:
   ```bash
   npm run prisma:studio
   ```
3. Or create a cleanup script to delete test data

## 📝 Notes

- **Public endpoints** don't require authentication (tests 1, 2, 5, 6, 9)
- **Protected endpoints** require a valid JWT token (tests 3, 4, 7, 8, 10)
- Tests run **sequentially** to avoid race conditions
- Some tests create temporary data that may need cleanup
- The AI test (test 9) may take longer as it calls the Gemini API

## 🔐 Security Reminder

⚠️ **IMPORTANT**: Never commit your JWT token to version control!
- Add `tests/question.test.js` to `.gitignore` if it contains real tokens
- Or use environment variables instead of hardcoding

## 📚 Next Steps

Once you're comfortable with these tests, consider:
1. Adding more edge case tests
2. Testing error scenarios (invalid data, unauthorized access)
3. Using a proper testing framework (Jest, Mocha)
4. Setting up automated test data seeding and cleanup
5. Implementing integration with CI/CD pipelines
