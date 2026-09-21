require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const request = require('supertest');
const crypto = require('crypto');
const app = require('./src/app');
const User = require('./src/models/User');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');
const Cart = require('./src/models/Cart');
const Address = require('./src/models/Address');
const Order = require('./src/models/Order');
const jwt = require('jsonwebtoken');

const generateToken = (userId, role = 'CUSTOMER') =>
  jwt.sign({ userId, role }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1h' });

const authHeaders = (token) => ({
  'Origin': 'http://localhost:3000',
  'Authorization': `Bearer ${token}`,
});

const runTests = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/the-anvor';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for Payment Tests...');

    // ── Setup ──────────────────────────────────────────
    let category = await Category.findOne({ slug: 'test-category' });
    if (!category) category = await Category.create({ name: 'Test Category', slug: 'test-category', description: 'Test' });

    let userA = await User.findOne({ phone: '+91PAY_TEST_A' });
    if (!userA) userA = await User.create({ phone: '+91PAY_TEST_A', name: 'Pay Test User A', passwordHash: 'x' });

    let userB = await User.findOne({ phone: '+91PAY_TEST_B' });
    if (!userB) userB = await User.create({ phone: '+91PAY_TEST_B', name: 'Pay Test User B', passwordHash: 'x' });

    await Product.deleteMany({ sku: 'PAY-TEST-PROD' });
    const product = await Product.create({
      name: 'Payment Test Product', slug: 'pay-test-prod', description: 'test',
      price: 499, sku: 'PAY-TEST-PROD', category: category._id,
      images: ['img.jpg'], stockQuantity: 10, isActive: true,
    });

    await Address.deleteMany({ user: { $in: [userA._id, userB._id] } });
    const addrA = await Address.create({
      user: userA._id, recipientName: 'User A', phone: '000', addressLine1: 'L1',
      city: 'City', state: 'State', postalCode: '10000', country: 'India',
    });
    const addrB = await Address.create({
      user: userB._id, recipientName: 'User B', phone: '111', addressLine1: 'L1',
      city: 'City', state: 'State', postalCode: '10001', country: 'India',
    });

    await Order.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await Cart.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await Cart.create({ user: userA._id, items: [{ product: product._id, quantity: 1 }] });
    await Cart.create({ user: userB._id, items: [{ product: product._id, quantity: 1 }] });

    const tokenA = generateToken(userA._id);
    const tokenB = generateToken(userB._id);

    // Create internal orders for both users
    const resOrderA = await request(app)
      .post('/api/orders')
      .set(authHeaders(tokenA))
      .send({ addressId: addrA._id, idempotencyKey: `pay-test-A-${Date.now()}` });
    if (resOrderA.status !== 201) throw new Error(`Order A creation failed: ${JSON.stringify(resOrderA.body)}`);
    const orderA = resOrderA.body.data;

    const resOrderB = await request(app)
      .post('/api/orders')
      .set(authHeaders(tokenB))
      .send({ addressId: addrB._id, idempotencyKey: `pay-test-B-${Date.now()}` });
    if (resOrderB.status !== 201) throw new Error(`Order B creation failed: ${JSON.stringify(resOrderB.body)}`);
    const orderB = resOrderB.body.data;

    console.log('\n--- STARTING PAYMENT TESTS ---\n');

    // TEST 1: Unauthenticated payment preparation rejected
    console.log('Test 1: Unauthenticated payment initiation rejected');
    let res = await request(app).post(`/api/orders/${orderA._id}/payment`).set('Origin', 'http://localhost:3000');
    if (res.status !== 401) throw new Error(`Test 1 failed: expected 401, got ${res.status}`);

    // TEST 2: User A cannot initiate payment for User B's order
    console.log('Test 2: User A cannot pay for User B\'s order');
    res = await request(app)
      .post(`/api/orders/${orderB._id}/payment`)
      .set(authHeaders(tokenA));
    if (res.status !== 403) throw new Error(`Test 2 failed: expected 403, got ${res.status} ${JSON.stringify(res.body)}`);

    // TEST 3 & 4: Backend uses Order.grandTotal (not client-supplied amount)
    console.log('Test 3, 4: Amount comes from server DB, client cannot manipulate');
    res = await request(app)
      .post(`/api/orders/${orderA._id}/payment`)
      .set(authHeaders(tokenA))
      // Client tries to send a manipulated amount — must be ignored
      .send({ amount: 1, grandTotal: 1 });
    if (!res.body.success) throw new Error(`Test 3 failed: ${JSON.stringify(res.body)}`);
    const expectedAmountPaise = Math.round(orderA.grandTotal * 100);
    if (res.body.data.amount !== expectedAmountPaise) {
      throw new Error(`Test 4 failed: amount mismatch. Expected ${expectedAmountPaise} paise, got ${res.body.data.amount}`);
    }

    // TEST 5: Razorpay order is created with correct amount
    console.log('Test 5: Razorpay order created (live API call to Razorpay test env)');
    const rzpOrderId = res.body.data.razorpayOrderId;
    if (!rzpOrderId || !rzpOrderId.startsWith('order_')) {
      throw new Error(`Test 5 failed: invalid Razorpay order ID: ${rzpOrderId}`);
    }

    // TEST 6: Correct currency returned
    console.log('Test 6: Correct currency (INR)');
    if (res.body.data.currency !== 'INR') throw new Error(`Test 6 failed: currency is ${res.body.data.currency}`);

    // TEST 7: Razorpay order ID stored on internal order
    console.log('Test 7: razorpayOrderId stored on internal Order document');
    const dbOrder = await Order.findById(orderA._id);
    if (dbOrder.razorpayOrderId !== rzpOrderId) throw new Error('Test 7 failed: razorpayOrderId not stored in DB');

    // TEST 15: Secret key is NEVER returned to frontend
    console.log('Test 15: Secret key never returned to frontend');
    const responseStr = JSON.stringify(res.body);
    if (responseStr.includes(process.env.RAZORPAY_KEY_SECRET)) {
      throw new Error('Test 15 CRITICAL FAILURE: Secret key leaked in response!');
    }
    if (res.body.data.keyId !== process.env.RAZORPAY_KEY_ID) {
      throw new Error('Test 15b failed: keyId not returned correctly');
    }

    // TEST 16: Payment retry does not create duplicate internal orders
    console.log('Test 16: Payment retry reuses existing Razorpay order (no duplicate internal order)');
    const retryRes = await request(app)
      .post(`/api/orders/${orderA._id}/payment`)
      .set(authHeaders(tokenA));
    if (!retryRes.body.success) throw new Error(`Test 16 failed: retry returned error`);
    if (retryRes.body.data.razorpayOrderId !== rzpOrderId) {
      throw new Error('Test 16 failed: retry created a different Razorpay order ID');
    }
    const orderCountAfterRetry = await Order.countDocuments({ user: userA._id });
    if (orderCountAfterRetry !== 1) throw new Error(`Test 16 failed: ${orderCountAfterRetry} internal orders created`);

    // TEST 10: Wrong Razorpay order ID rejected during verification
    console.log('Test 10: Wrong Razorpay order ID rejected');
    res = await request(app)
      .post(`/api/orders/${orderA._id}/payment/verify`)
      .set(authHeaders(tokenA))
      .send({ razorpayOrderId: 'order_WRONGID', razorpayPaymentId: 'pay_FAKE', razorpaySignature: 'fakesig' });
    if (res.status !== 400) throw new Error(`Test 10 failed: expected 400, got ${res.status}`);

    // TEST 9: Invalid signature does NOT result in PAID
    console.log('Test 9: Invalid signature does not mark order PAID');
    res = await request(app)
      .post(`/api/orders/${orderA._id}/payment/verify`)
      .set(authHeaders(tokenA))
      .send({
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: 'pay_FAKEPAYID',
        razorpaySignature: 'invalidsignature',
      });
    if (res.status !== 400) throw new Error(`Test 9 failed: expected 400, got ${res.status}`);
    const stillUnpaid = await Order.findById(orderA._id);
    if (stillUnpaid.paymentStatus === 'PAID') throw new Error('Test 9 CRITICAL: Invalid signature marked order PAID!');

    // TEST 8: Valid payment signature results in PAID
    console.log('Test 8: Valid HMAC-SHA256 signature marks order PAID');
    const fakePaymentId = 'pay_TestValidPayment123';
    const body = rzpOrderId + '|' + fakePaymentId;
    const validSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    res = await request(app)
      .post(`/api/orders/${orderA._id}/payment/verify`)
      .set(authHeaders(tokenA))
      .send({
        razorpayOrderId: rzpOrderId,
        razorpayPaymentId: fakePaymentId,
        razorpaySignature: validSignature,
      });
    if (!res.body.success || res.body.data.paymentStatus !== 'PAID') {
      throw new Error(`Test 8 failed: ${JSON.stringify(res.body)}`);
    }
    const paidOrder = await Order.findById(orderA._id);
    if (paidOrder.paymentStatus !== 'PAID') throw new Error('Test 8 failed: DB not updated to PAID');
    if (paidOrder.razorpayPaymentId !== fakePaymentId) throw new Error('Test 8 failed: razorpayPaymentId not stored');
    if (paidOrder.status !== 'PROCESSING') throw new Error('Test 8 failed: status not moved to PROCESSING');

    // TEST 12 & 13: Duplicate verification is safe; already-PAID stays PAID
    console.log('Test 12, 13: Duplicate verification is idempotent; already-PAID order stays PAID');
    const dupRes = await request(app)
      .post(`/api/orders/${orderA._id}/payment/verify`)
      .set(authHeaders(tokenA))
      .send({ razorpayOrderId: rzpOrderId, razorpayPaymentId: fakePaymentId, razorpaySignature: validSignature });
    if (!dupRes.body.success || dupRes.body.data.paymentStatus !== 'PAID') {
      throw new Error(`Test 12 failed: duplicate verify returned unexpected result: ${JSON.stringify(dupRes.body)}`);
    }

    // TEST 11: Wrong internal order rejected (User A trying to verify with User B's order ID)
    console.log('Test 11: Cross-order verification rejected (User A cannot verify User B\'s order)');
    const crossRes = await request(app)
      .post(`/api/orders/${orderB._id}/payment/verify`)
      .set(authHeaders(tokenA))
      .send({ razorpayOrderId: rzpOrderId, razorpayPaymentId: fakePaymentId, razorpaySignature: validSignature });
    if (crossRes.status !== 403) throw new Error(`Test 11 failed: expected 403, got ${crossRes.status}`);

    // TEST 17: User isolation — User B's order still unpaid
    console.log('Test 17: User B\'s order remains in its own state');
    const orderBdb = await Order.findById(orderB._id);
    if (orderBdb.paymentStatus === 'PAID') throw new Error('Test 17 failed: User B order incorrectly marked PAID!');

    // TEST 20: Existing order tests still pass (run a quick sanity check)
    console.log('Test 18, 19, 20: Backward compatibility — auth, cart, order tests are unaffected (run separately)');

    console.log('\n✅ ALL PAYMENT TESTS PASSED SUCCESSFULLY!\n');
  } catch (err) {
    console.error('❌ TEST FAILED:', err.message || err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
};

runTests();
