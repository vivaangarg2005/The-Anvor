require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const otpService = require('./src/services/otpService');
const OtpRecord = require('./src/models/OtpRecord');
const authConfig = require('./src/config/authConfig');

const runTests = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/the-anvor';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for OTP Tests...');
    
    const phone = '+919876543210';
    const purpose = 'LOGIN';
    const channel = 'SMS';
    
    // Clear previous tests
    await OtpRecord.deleteMany({ phone });

    // 1. requestOtp creates record
    console.log('Testing OTP Request...');
    // We mock messageProvider to intercept the plaintext OTP
    const messageProvider = require('./src/providers/messageProvider');
    let capturedOtp = null;
    messageProvider.sendMessage = async ({ otp }) => { capturedOtp = otp; };
    
    await otpService.requestOtp({ phone, channel, purpose });
    if (!capturedOtp) throw new Error('OTP was not passed to messageProvider');
    
    // 2. Plaintext not stored in Mongo
    const record = await OtpRecord.findOne({ phone }).sort({ createdAt: -1 });
    if (record.otpHash === capturedOtp || !record.otpHash) throw new Error('OTP stored in plaintext!');
    console.log('✅ Plaintext not stored in DB (Hashed).');
    
    // 3. Resend cooldown
    console.log('Testing Resend Cooldown...');
    try {
      await otpService.requestOtp({ phone, channel, purpose });
      throw new Error('Cooldown failed to block resend');
    } catch (err) {
      if (err.statusCode !== 429) throw err;
      console.log('✅ Resend cooldown enforced (429).');
    }
    
    // 4. Invalid OTP
    console.log('Testing Invalid OTP...');
    try {
      await otpService.verifyOtp({ phone, otp: '000000', purpose });
      throw new Error('Invalid OTP accepted');
    } catch (err) {
      if (!err.message.includes('Invalid')) throw err;
      console.log('✅ Invalid OTP rejected.');
    }
    
    // 5. Max Attempts
    console.log('Testing Max Attempts...');
    try {
      for (let i = 0; i < 4; i++) {
        await otpService.verifyOtp({ phone, otp: '000000', purpose }).catch(() => {});
      }
      await otpService.verifyOtp({ phone, otp: '000000', purpose });
      throw new Error('Max attempts not enforced');
    } catch (err) {
      if (err.statusCode !== 429) throw err;
      console.log('✅ Max attempts enforced.');
    }

    // 6. Valid OTP
    console.log('Testing Valid OTP (after clearing old record)...');
    await OtpRecord.deleteMany({ phone });
    await otpService.requestOtp({ phone, channel, purpose });
    
    // 7. Expired OTP
    console.log('Testing Expired OTP...');
    const expiredRecord = await OtpRecord.findOne({ phone }).sort({ createdAt: -1 });
    expiredRecord.expiresAt = new Date(Date.now() - 1000); // Set to past
    await expiredRecord.save();
    try {
      await otpService.verifyOtp({ phone, otp: capturedOtp, purpose });
      throw new Error('Expired OTP accepted');
    } catch (err) {
      if (err.statusCode !== 400) throw err;
      console.log('✅ Expired OTP rejected.');
    }

    // Request new for valid verification
    await OtpRecord.deleteMany({ phone });
    await otpService.requestOtp({ phone, channel, purpose });

    console.log('Testing Valid OTP & Consumed state...');
    await otpService.verifyOtp({ phone, otp: capturedOtp, purpose });
    console.log('✅ Valid OTP verified successfully.');

    // 8. Consumed/Replayed OTP
    try {
      await otpService.verifyOtp({ phone, otp: capturedOtp, purpose });
      throw new Error('Consumed OTP accepted again');
    } catch (err) {
      if (err.statusCode !== 400) throw err;
      console.log('✅ Consumed/replayed OTP rejected.');
    }

    console.log('🎉 All OTP Tests Passed!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test Failed:', err);
    process.exit(1);
  }
};

runTests();
