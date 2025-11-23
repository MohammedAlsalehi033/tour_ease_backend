/**
 * Test script for My Bookings endpoints
 * Run with: npx ts-node test-my-bookings-endpoints.ts
 */

import axios from 'axios';

// Use your deployed API
const BASE_URL = 'https://api.tourease.me/api';
// Or test locally: const BASE_URL = 'http://localhost:3000/api';

async function testEndpoints() {
  console.log('🧪 Testing My Bookings Endpoints\n');
  console.log('Base URL:', BASE_URL);
  console.log('─'.repeat(60));

  // Test 1: Get bookings by traveler
  console.log('\n📋 Test 1: Get Bookings by Traveler');
  try {
    const response = await axios.get(`${BASE_URL}/accommodation-bookings/traveler/tE2jRYBUUuZCc3DF65KyeGsLJ3A2`);
    console.log('✅ SUCCESS');
    console.log('Status:', response.status);
    console.log('Bookings found:', response.data.data?.bookings?.length || 0);
    
    // Find a confirmed booking for cancel test
    const confirmedBooking = response.data.data?.bookings?.find((b: any) => b.status === 'confirmed');
    if (confirmedBooking) {
      console.log(`   Found confirmed booking ID: ${confirmedBooking.id}`);
    }
    
    // Find a checked out booking for review test
    const checkedOutBooking = response.data.data?.bookings?.find((b: any) => b.status === 'checked out');
    if (checkedOutBooking) {
      console.log(`   Found checked out booking ID: ${checkedOutBooking.id}`);
    }
  } catch (error: any) {
    console.log('❌ FAILED');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
    } else {
      console.log('Error:', error.message);
    }
  }

  // Test 2: Cancel booking
  console.log('\n🚫 Test 2: Cancel Booking (ID: 44)');
  try {
    const response = await axios.patch(`${BASE_URL}/accommodation-bookings/44/cancel-and-refund`, {});
    console.log('✅ SUCCESS');
    console.log('Status:', response.status);
    console.log('Message:', response.data.message);
    console.log('New status:', response.data.data?.status);
  } catch (error: any) {
    console.log('❌ FAILED');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
      
      // Check if it's an HTML error (route not found)
      if (typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE html>')) {
        console.log('⚠️  ROUTE NOT FOUND - Server returned HTML error page');
        console.log('   This means the route is not registered on the server');
        console.log('   The server needs to be restarted with the new code');
      }
    } else {
      console.log('Error:', error.message);
    }
  }

  // Test 3: Submit review
  console.log('\n⭐ Test 3: Submit Review (ID: 28)');
  try {
    const response = await axios.post(`${BASE_URL}/accommodation-bookings/28/review`, {
      rating: 5,
      comment: 'Test review from automated script'
    });
    console.log('✅ SUCCESS');
    console.log('Status:', response.status);
    console.log('Message:', response.data.message);
    console.log('New status:', response.data.data?.booking?.status);
  } catch (error: any) {
    console.log('❌ FAILED');
    if (error.response) {
      console.log('Status:', error.response.status);
      console.log('Error:', error.response.data);
      
      // Check if it's an HTML error (route not found)
      if (typeof error.response.data === 'string' && error.response.data.includes('<!DOCTYPE html>')) {
        console.log('⚠️  ROUTE NOT FOUND - Server returned HTML error page');
        console.log('   This means the route is not registered on the server');
        console.log('   The server needs to be restarted with the new code');
      }
    } else {
      console.log('Error:', error.message);
    }
  }

  console.log('\n' + '─'.repeat(60));
  console.log('\n📝 Summary:');
  console.log('If you see "ROUTE NOT FOUND" errors above, you need to:');
  console.log('1. SSH into your production server');
  console.log('2. Navigate to the backend directory');
  console.log('3. Run: ./deploy.sh (or deploy.bat on Windows)');
  console.log('4. Or manually: git pull && npm run build && pm2 restart tour_ease_backend');
  console.log('');
}

testEndpoints().catch(console.error);
