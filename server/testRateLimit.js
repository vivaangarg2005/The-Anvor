const http = require('http');

async function makeRequest() {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: '/api/auth/otp/request',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    });

    req.on('error', error => reject(error));
    // Provide a dummy phone just to hit the rate limiter before the actual OTP logic triggers if we hit limits
    req.write(JSON.stringify({ phone: '+910000000000', channel: 'SMS', purpose: 'LOGIN' }));
    req.end();
  });
}

async function runTest() {
  console.log('Running Rate Limit Test (21 requests)...');
  let successCount = 0;
  let rateLimitedCount = 0;
  
  for (let i = 1; i <= 21; i++) {
    try {
      const res = await makeRequest();
      if (res.statusCode === 429 && res.data.includes('Too many authentication attempts')) {
        rateLimitedCount++;
        console.log(`Request ${i}: Rate Limited (429)`);
      } else {
        successCount++;
        console.log(`Request ${i}: Allowed (${res.statusCode})`);
      }
    } catch (e) {
      console.log(`Request ${i}: Failed (${e.message})`);
    }
  }
  
  console.log(`\nResults: Allowed = ${successCount}, Rate Limited = ${rateLimitedCount}`);
  if (rateLimitedCount > 0) {
    console.log('✅ Rate Limiting is active and working properly!');
    process.exit(0);
  } else {
    console.error('❌ Rate Limiting failed to trigger.');
    process.exit(1);
  }
}

runTest();
