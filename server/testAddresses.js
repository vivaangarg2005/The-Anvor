require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('./src/app');
const User = require('./src/models/User');
const Address = require('./src/models/Address');
const authService = require('./src/services/authService');
const authConfig = require('./src/config/authConfig');

const TEST_PHONE_1 = '9999999991';
const TEST_PHONE_2 = '9999999992';

async function setup() {
  await mongoose.connect(process.env.MONGODB_URI);
  await User.deleteMany({ phone: { $in: [TEST_PHONE_1, TEST_PHONE_2] } });
  await User.deleteMany({ email: { $in: ['testa@anvor.com', 'testb@anvor.com'] } });
  await Address.deleteMany({}); // wipe all addresses for clean test

  const u1 = await authService.registerUser({
    name: 'Address Tester A',
    phone: TEST_PHONE_1,
    email: 'testa@anvor.com',
    password: 'password123'
  });
  
  const u2 = await authService.registerUser({
    name: 'Address Tester B',
    phone: TEST_PHONE_2,
    email: 'testb@anvor.com',
    password: 'password123'
  });

  return { 
    tokenA: u1.token, 
    userA: u1.user, 
    tokenB: u2.token, 
    userB: u2.user 
  };
}

async function runTests() {
  console.log('Starting Address API Tests...');
  const { tokenA, userA, tokenB, userB } = await setup();

  const getCookie = (token) => `${authConfig.cookie.name}=${token}`;

  let addressAId;
  
  try {
    // 1. Unauthenticated request rejected
    let res = await request(app).get('/api/addresses');
    if (res.status !== 401) throw new Error('Unauthenticated request should return 401');
    console.log('✅ Unauthenticated request rejected');

    // 2. Authenticated user can create address
    res = await request(app)
      .post('/api/addresses')
      .set('Cookie', getCookie(tokenA))
      .set('Origin', 'http://localhost:3000')
      .send({
        recipientName: 'Tester A',
        phone: '9999999991',
        addressLine1: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India',
        isDefault: false
      });
    if (res.status !== 201) throw new Error(`Create address failed: ${res.body.error}`);
    if (!res.body.data.isDefault) throw new Error('First address should automatically become default');
    addressAId = res.body.data._id;
    console.log('✅ Authenticated user created first address (auto-defaulted)');

    // 2b. Test Phone Validation (Invalid)
    let badRes = await request(app)
      .post('/api/addresses')
      .set('Cookie', getCookie(tokenA))
      .set('Origin', 'http://localhost:3000')
      .send({
        recipientName: 'Tester A',
        phone: 'abc123xyz',
        addressLine1: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400001',
        country: 'India'
      });
    if (badRes.status !== 400 || !badRes.body.error.includes('format')) throw new Error('Phone validation failed');
    console.log('✅ Phone validation successfully rejected invalid format');

    // 2c. Test Postal Code Validation (Invalid for India)
    badRes = await request(app)
      .post('/api/addresses')
      .set('Cookie', getCookie(tokenA))
      .set('Origin', 'http://localhost:3000')
      .send({
        recipientName: 'Tester A',
        phone: '9999999991',
        addressLine1: '123 Main St',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: 'abc',
        country: 'India'
      });
    if (badRes.status !== 400 || !badRes.body.error.includes('digits')) throw new Error('Postal code validation failed');
    console.log('✅ Postal code validation successfully rejected invalid PIN format');

    // Create a second address for A
    res = await request(app)
      .post('/api/addresses')
      .set('Cookie', getCookie(tokenA))
      .set('Origin', 'http://localhost:3000')
      .send({
        recipientName: 'Tester A Work',
        phone: '9999999991',
        addressLine1: '456 Office Rd',
        city: 'Mumbai',
        state: 'Maharashtra',
        postalCode: '400002',
        country: 'India',
        isDefault: true // Explicitly making it default
      });
    const addressA2Id = res.body.data._id;
    if (!res.body.data.isDefault) throw new Error('Second address should be default');
    console.log('✅ Second address created explicitly as default');

    // 3. User can retrieve own addresses
    res = await request(app).get('/api/addresses').set('Cookie', getCookie(tokenA));
    if (res.body.data.length !== 2) throw new Error('Should have 2 addresses');
    // First element should be the default one
    if (res.body.data[0]._id !== addressA2Id) throw new Error('Default address should be sorted first');
    console.log('✅ Authenticated user retrieved own addresses');

    // 4. Cross-user read blocked (B cannot see A's addresses)
    res = await request(app).get('/api/addresses').set('Cookie', getCookie(tokenB));
    if (res.body.data.length !== 0) throw new Error('User B should not see User A addresses');
    console.log('✅ Cross-user address read blocked');

    // 5. Cross-user update blocked (B cannot update A's address)
    res = await request(app)
      .patch(`/api/addresses/${addressAId}`)
      .set('Cookie', getCookie(tokenB))
      .set('Origin', 'http://localhost:3000')
      .send({ city: 'Delhi' });
    if (res.status !== 404) throw new Error('Cross-user update should return 404');
    console.log('✅ Cross-user address update blocked');

    // 6. Authenticated user can update own address
    res = await request(app)
      .patch(`/api/addresses/${addressAId}`)
      .set('Cookie', getCookie(tokenA))
      .set('Origin', 'http://localhost:3000')
      .send({ city: 'Pune' });
    if (res.body.data.city !== 'Pune') throw new Error('Update failed');
    console.log('✅ Authenticated user updated own address');

    // 7. Authenticated user can set default address (Setting A1 to default should unset A2)
    res = await request(app)
      .post(`/api/addresses/${addressAId}/default`)
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', getCookie(tokenA));
    if (!res.body.data.isDefault) throw new Error('Set default failed');
    
    // Check A2
    const a2db = await Address.findById(addressA2Id);
    if (a2db.isDefault) throw new Error('Previous default was not unset');
    console.log('✅ Setting B default unsets A default');

    // 8. Cross-user delete blocked
    res = await request(app)
      .delete(`/api/addresses/${addressAId}`)
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', getCookie(tokenB));
    if (res.status !== 404) throw new Error('Cross-user delete should return 404');
    console.log('✅ Cross-user address delete blocked');

    // 9. Authenticated user can delete own address
    res = await request(app)
      .delete(`/api/addresses/${addressA2Id}`)
      .set('Origin', 'http://localhost:3000')
      .set('Cookie', getCookie(tokenA));
    if (res.status !== 200) throw new Error('Delete failed');
    
    const remaining = await Address.findById(addressA2Id);
    if (remaining) throw new Error('Address was not deleted');
    console.log('✅ Authenticated user deleted own address');

    console.log('\\n🎉 All Address API tests passed!\\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.connection.close();
  }
}

runTests();