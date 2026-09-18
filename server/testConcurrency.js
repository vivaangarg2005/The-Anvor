require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const otpService = require('./src/services/otpService');
const OtpRecord = require('./src/models/OtpRecord');

const runConcurrencyTest = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/the-anvor';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for Concurrency Tests...');
    
    const phone = '+919999999999'; // test phone
    const purpose = 'LOGIN';
    const channel = 'SMS';
    
    await OtpRecord.deleteMany({ phone });

    // Mock message provider
    const messageProvider = require('./src/providers/messageProvider');
    let capturedOtp = null;
    messageProvider.sendMessage = async ({ otp }) => { capturedOtp = otp; };
    
    await otpService.requestOtp({ phone, channel, purpose });
    console.log('OTP Requested. Captured OTP:', capturedOtp);

    // Attempt concurrent verifications
    console.log('Launching 5 concurrent verification requests...');
    const promises = [];
    for (let i = 0; i < 5; i++) {
      promises.push(
        otpService.verifyOtp({ phone, otp: capturedOtp, purpose })
          .then(() => 'SUCCESS')
          .catch(err => `FAIL: ${err.message}`)
      );
    }

    const results = await Promise.all(promises);
    
    let successCount = 0;
    let failCount = 0;
    
    results.forEach((res, i) => {
      console.log(`Request ${i + 1}: ${res}`);
      if (res === 'SUCCESS') successCount++;
      else failCount++;
    });

    if (successCount === 1 && failCount === 4) {
      console.log('✅ Concurrency test PASSED! Only exactly one request succeeded.');
    } else {
      console.error(`❌ Concurrency test FAILED! Success count: ${successCount}, Fail count: ${failCount}`);
      process.exit(1);
    }
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Test Failed:', err);
    process.exit(1);
  }
};

runConcurrencyTest();
