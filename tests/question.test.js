/**
 * Question API Test Suite
 * 
 * This file contains 10 test cases for the Questions functionality.
 * 
 * SETUP INSTRUCTIONS:
 * 1. Replace HARDCODED_JWT_TOKEN with a valid JWT token from your system
 * 2. Update BASE_URL if your server runs on a different port
 * 3. Update EXISTING_QUESTION_ID with a real question ID from your database
 * 4. Install required packages: npm install --save-dev axios
 * 5. Run tests: node tests/question.test.js
 * 
 * NOTE: Some test cases create data, so you may want to clean up after running
 */

const axios = require('axios');

// ============================================
// CONFIGURATION - UPDATE THESE VALUES
// ============================================

// TODO: Replace with a valid JWT token for a traveler user
const HARDCODED_JWT_TOKEN = 'YOUR_JWT_TOKEN_HERE';

// Base URL for the API
const BASE_URL = 'http://localhost:3000/api';

// TODO: Replace with an existing question ID from your database
let EXISTING_QUESTION_ID = 1;

// Store created question IDs for cleanup
let createdQuestionIds = [];

// ============================================
// TEST UTILITIES
// ============================================

let passedTests = 0;
let failedTests = 0;

function logSuccess(testName) {
    passedTests++;
    console.log(`✅ PASSED: ${testName}`);
}

function logFailure(testName, error) {
    failedTests++;
    console.log(`❌ FAILED: ${testName}`);
    console.log(`   Error: ${error.message}`);
    if (error.response) {
        console.log(`   Status: ${error.response.status}`);
        console.log(`   Data:`, error.response.data);
    }
}

function logTestStart(testNumber, testName) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Test ${testNumber}: ${testName}`);
    console.log('='.repeat(60));
}

function printSummary() {
    console.log(`\n${'='.repeat(60)}`);
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${passedTests}`);
    console.log(`❌ Failed: ${failedTests}`);
    console.log(`📊 Total: ${passedTests + failedTests}`);
    console.log(`📈 Success Rate: ${((passedTests / (passedTests + failedTests)) * 100).toFixed(2)}%`);
    console.log('='.repeat(60));
}

// ============================================
// TEST CASES
// ============================================

/**
 * TEST 1: Get All Questions (Public Endpoint)
 * Tests pagination and sorting functionality
 */
async function test1_getAllQuestions() {
    logTestStart(1, 'Get All Questions with Pagination');
    
    try {
        const response = await axios.get(`${BASE_URL}/questions`, {
            params: {
                page: 1,
                limit: 5,
                sort: 'newest'
            }
        });
        
        if (response.status === 200 && 
            response.data.success === true && 
            Array.isArray(response.data.data)) {
            console.log(`   Retrieved ${response.data.data.length} questions`);
            logSuccess('Get All Questions');
        } else {
            throw new Error('Invalid response structure');
        }
    } catch (error) {
        logFailure('Get All Questions', error);
    }
}

/**
 * TEST 2: Get Question by ID (Public Endpoint)
 * Tests retrieval of a specific question with comments
 */
async function test2_getQuestionById() {
    logTestStart(2, 'Get Question by ID');
    
    try {
        const response = await axios.get(`${BASE_URL}/questions/${EXISTING_QUESTION_ID}`);
        
        if (response.status === 200 && 
            response.data.success === true && 
            response.data.data.id) {
            console.log(`   Question Title: ${response.data.data.title}`);
            console.log(`   Comments Count: ${response.data.data.comments?.length || 0}`);
            logSuccess('Get Question by ID');
        } else {
            throw new Error('Invalid response structure');
        }
    } catch (error) {
        logFailure('Get Question by ID', error);
    }
}

/**
 * TEST 3: Create a New Question (Protected - Requires JWT)
 * Tests question creation with authentication
 */
async function test3_createQuestion() {
    logTestStart(3, 'Create New Question (Auth Required)');
    
    try {
        const questionData = {
            title: 'What are the best places to visit in Lahore?',
            description: 'I am planning a trip to Lahore and would like recommendations for must-see attractions, historical sites, and local food spots.',
            tags: ['lahore', 'travel', 'pakistan', 'tourism']
        };
        
        const response = await axios.post(`${BASE_URL}/questions`, questionData, {
            headers: {
                'Authorization': `Bearer ${HARDCODED_JWT_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 201 && 
            response.data.success === true && 
            response.data.data.id) {
            createdQuestionIds.push(response.data.data.id);
            console.log(`   Created Question ID: ${response.data.data.id}`);
            console.log(`   Title: ${response.data.data.title}`);
            logSuccess('Create New Question');
        } else {
            throw new Error('Invalid response structure');
        }
    } catch (error) {
        logFailure('Create New Question', error);
    }
}

/**
 * TEST 4: Update a Question (Protected - Requires JWT)
 * Tests updating an existing question
 */
async function test4_updateQuestion() {
    logTestStart(4, 'Update Question (Auth Required)');
    
    // First create a question to update
    try {
        const createResponse = await axios.post(`${BASE_URL}/questions`, {
            title: 'Original Question Title',
            description: 'Original description',
            tags: ['test']
        }, {
            headers: {
                'Authorization': `Bearer ${HARDCODED_JWT_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        const questionId = createResponse.data.data.id;
        createdQuestionIds.push(questionId);
        
        // Now update it
        const updateData = {
            title: 'Updated: Best hiking trails in Northern Pakistan?',
            description: 'Looking for detailed information about hiking trails in Hunza and Skardu regions.',
            tags: ['hiking', 'northern-pakistan', 'adventure']
        };
        
        const updateResponse = await axios.put(`${BASE_URL}/questions/${questionId}`, updateData, {
            headers: {
                'Authorization': `Bearer ${HARDCODED_JWT_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (updateResponse.status === 200 && 
            updateResponse.data.success === true) {
            console.log(`   Updated Question ID: ${questionId}`);
            console.log(`   New Title: ${updateResponse.data.data.title}`);
            logSuccess('Update Question');
        } else {
            throw new Error('Invalid response structure');
        }
    } catch (error) {
        logFailure('Update Question', error);
    }
}

/**
 * TEST 5: Search Questions by Keyword (Public Endpoint)
 * Tests search functionality
 */
async function test5_searchQuestions() {
    logTestStart(5, 'Search Questions by Keyword');
    
    try {
        const response = await axios.get(`${BASE_URL}/questions/search`, {
            params: {
                query: 'Lahore',
                page: 1,
                limit: 10
            }
        });
        
        if (response.status === 200 && 
            response.data.success === true && 
            Array.isArray(response.data.data)) {
            console.log(`   Found ${response.data.data.length} questions matching "Lahore"`);
            logSuccess('Search Questions');
        } else {
            throw new Error('Invalid response structure');
        }
    } catch (error) {
        logFailure('Search Questions', error);
    }
}

/**
 * TEST 6: Search Questions by Tag (Public Endpoint)
 * Tests tag-based filtering
 */
async function test6_searchQuestionsByTag() {
    logTestStart(6, 'Search Questions by Tag');
    
    try {
        const response = await axios.get(`${BASE_URL}/questions/tag/travel`, {
            params: {
                page: 1,
                limit: 10
            }
        });
        
        if (response.status === 200 && 
            response.data.success === true && 
            Array.isArray(response.data.data)) {
            console.log(`   Found ${response.data.data.length} questions with tag "travel"`);
            logSuccess('Search Questions by Tag');
        } else {
            throw new Error('Invalid response structure');
        }
    } catch (error) {
        logFailure('Search Questions by Tag', error);
    }
}

/**
 * TEST 7: Vote on a Question - Upvote (Protected - Requires JWT)
 * Tests upvoting functionality
 */
async function test7_upvoteQuestion() {
    logTestStart(7, 'Upvote Question (Auth Required)');
    
    try {
        const voteData = {
            id: EXISTING_QUESTION_ID,
            isUpVote: true
        };
        
        const response = await axios.post(`${BASE_URL}/questions/vote`, voteData, {
            headers: {
                'Authorization': `Bearer ${HARDCODED_JWT_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 200 && 
            response.data.success === true) {
            console.log(`   Upvoted Question ID: ${EXISTING_QUESTION_ID}`);
            console.log(`   New Upvotes: ${response.data.data.upvotes}`);
            logSuccess('Upvote Question');
        } else {
            throw new Error('Invalid response structure');
        }
    } catch (error) {
        logFailure('Upvote Question', error);
    }
}

/**
 * TEST 8: Vote on a Question - Downvote (Protected - Requires JWT)
 * Tests downvoting functionality
 */
async function test8_downvoteQuestion() {
    logTestStart(8, 'Downvote Question (Auth Required)');
    
    try {
        const voteData = {
            id: EXISTING_QUESTION_ID,
            isUpVote: false
        };
        
        const response = await axios.post(`${BASE_URL}/questions/vote`, voteData, {
            headers: {
                'Authorization': `Bearer ${HARDCODED_JWT_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 200 && 
            response.data.success === true) {
            console.log(`   Downvoted Question ID: ${EXISTING_QUESTION_ID}`);
            console.log(`   New Downvotes: ${response.data.data.downvotes}`);
            logSuccess('Downvote Question');
        } else {
            throw new Error('Invalid response structure');
        }
    } catch (error) {
        logFailure('Downvote Question', error);
    }
}

/**
 * TEST 9: Ask AI for Travel Advice (Public Endpoint)
 * Tests AI integration functionality
 */
async function test9_askAI() {
    logTestStart(9, 'Ask AI for Travel Advice');
    
    try {
        const aiQuery = {
            title: 'Best time to visit Murree',
            description: 'When is the best time to visit Murree for snowfall and pleasant weather?',
            tags: ['murree', 'weather', 'timing']
        };
        
        const response = await axios.post(`${BASE_URL}/questions/ai`, aiQuery, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.status === 200 && 
            response.data.success === true && 
            response.data.data.title) {
            console.log(`   AI Response Title: ${response.data.data.title}`);
            console.log(`   Sections Count: ${response.data.data.sections?.length || 0}`);
            logSuccess('Ask AI for Travel Advice');
        } else {
            throw new Error('Invalid response structure');
        }
    } catch (error) {
        logFailure('Ask AI for Travel Advice', error);
    }
}

/**
 * TEST 10: Delete a Question (Protected - Requires JWT)
 * Tests question deletion functionality
 */
async function test10_deleteQuestion() {
    logTestStart(10, 'Delete Question (Auth Required)');
    
    // First create a question to delete
    try {
        const createResponse = await axios.post(`${BASE_URL}/questions`, {
            title: 'Question to be deleted',
            description: 'This question will be deleted in the test',
            tags: ['test']
        }, {
            headers: {
                'Authorization': `Bearer ${HARDCODED_JWT_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        const questionId = createResponse.data.data.id;
        
        // Now delete it
        const deleteResponse = await axios.delete(`${BASE_URL}/questions/${questionId}`, {
            headers: {
                'Authorization': `Bearer ${HARDCODED_JWT_TOKEN}`
            }
        });
        
        if (deleteResponse.status === 200 && 
            deleteResponse.data.success === true) {
            console.log(`   Deleted Question ID: ${questionId}`);
            logSuccess('Delete Question');
            
            // Remove from cleanup list since it's already deleted
            createdQuestionIds = createdQuestionIds.filter(id => id !== questionId);
        } else {
            throw new Error('Invalid response structure');
        }
    } catch (error) {
        logFailure('Delete Question', error);
    }
}

// ============================================
// TEST RUNNER
// ============================================

async function runAllTests() {
    console.log('\n');
    console.log('🚀 Starting Question API Test Suite');
    console.log('='.repeat(60));
    console.log(`Base URL: ${BASE_URL}`);
    console.log(`JWT Token: ${HARDCODED_JWT_TOKEN.substring(0, 20)}...`);
    console.log('='.repeat(60));
    
    // Run all tests sequentially
    await test1_getAllQuestions();
    await test2_getQuestionById();
    await test3_createQuestion();
    await test4_updateQuestion();
    await test5_searchQuestions();
    await test6_searchQuestionsByTag();
    await test7_upvoteQuestion();
    await test8_downvoteQuestion();
    await test9_askAI();
    await test10_deleteQuestion();
    
    // Print summary
    printSummary();
    
    // Cleanup reminder
    if (createdQuestionIds.length > 0) {
        console.log(`\n⚠️  CLEANUP NEEDED: ${createdQuestionIds.length} question(s) were created during testing`);
        console.log(`   IDs: ${createdQuestionIds.join(', ')}`);
        console.log(`   Consider deleting these manually or run a cleanup script`);
    }
}

// Run the tests
runAllTests().catch(error => {
    console.error('Fatal error running tests:', error);
    process.exit(1);
});
