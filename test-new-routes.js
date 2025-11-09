const http = require('http');

function makeRequestWithBody(path, method = 'PATCH', body = {}) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(body);
    const options = {
      hostname: 'localhost',
      port: 3000,
      path: path,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          data: data
        });
      });
    });

    req.on('error', (err) => {
      reject(err);
    });

    req.write(postData);
    req.end();
  });
}

async function testRoutes() {
  try {
    console.log('Testing extend-checkout route with booking ID 1...');
    const extendResponse = await makeRequestWithBody('/api/accommodation-bookings/1/extend-checkout', 'PATCH', {
      newCheckoutDate: '2025-12-10T10:00:00.000Z'
    });
    console.log('Extend status:', extendResponse.status);
    console.log('Extend response:', extendResponse.data);

    console.log('\nTesting extend-checkout-any route with booking ID 1...');
    const extendAnyResponse = await makeRequestWithBody('/api/accommodation-bookings/1/extend-checkout-any', 'PATCH', {
      newCheckoutDate: '2025-12-20T10:00:00.000Z'
    });
    console.log('Extend Any status:', extendAnyResponse.status);
    console.log('Extend Any response:', extendAnyResponse.data);

  } catch (error) {
    console.error('Error:', error.message);
  }
}

testRoutes();