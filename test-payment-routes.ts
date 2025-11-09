import axios from 'axios';

const BASE_URL = 'http://localhost:3000/api';

async function testPaymentRoutes() {
  console.log('🧪 Testing Payment Routes on Localhost...\n');

  try {
    // Test 1: GET all payments
    console.log('📝 Test 1: GET /api/payments (get all payments)');
    const getAllRes = await axios.get(`${BASE_URL}/payments`);
    console.log('✅ Status:', getAllRes.status);
    console.log('✅ Response:', JSON.stringify(getAllRes.data).substring(0, 200));
    console.log('');

    // Test 2: POST create payment
    console.log('📝 Test 2: POST /api/payments (create payment)');
    const createPaymentRes = await axios.post(`${BASE_URL}/payments`, {
      accommodationBookingId: 123,
      amount: 500.00,
      paymentMethod: 'stripe',
      transactionId: 'ch_test_123',
      status: 'completed'
    });
    console.log('✅ Status:', createPaymentRes.status);
    console.log('✅ Created Payment ID:', createPaymentRes.data.data?.id);
    console.log('✅ Response:', JSON.stringify(createPaymentRes.data).substring(0, 200));
    console.log('');

    // Test 3: GET payment by ID
    if (createPaymentRes.data.data?.id) {
      console.log('📝 Test 3: GET /api/payments/:id (get payment by ID)');
      const getByIdRes = await axios.get(`${BASE_URL}/payments/${createPaymentRes.data.data.id}`);
      console.log('✅ Status:', getByIdRes.status);
      console.log('✅ Response:', JSON.stringify(getByIdRes.data).substring(0, 200));
      console.log('');
    }

    // Test 4: GET /summary/statistics
    console.log('📝 Test 4: GET /api/payments/summary/statistics (get statistics)');
    const statsRes = await axios.get(`${BASE_URL}/payments/summary/statistics`);
    console.log('✅ Status:', statsRes.status);
    console.log('✅ Response:', JSON.stringify(statsRes.data).substring(0, 200));
    console.log('');

    console.log('🎉 All tests PASSED! Payment routes are working on localhost!');
  } catch (error: any) {
    console.error('❌ Error during testing:');
    console.error('Message:', error.message);
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data).substring(0, 200));
    }
  }
}

testPaymentRoutes();
