require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('./src/app');
const User = require('./src/models/User');
const Product = require('./src/models/Product');
const Category = require('./src/models/Category');
const Cart = require('./src/models/Cart');
const Address = require('./src/models/Address');
const Order = require('./src/models/Order');
const jwt = require('jsonwebtoken');

// Helper to generate JWT token for mocking auth
const generateToken = (userId, role = 'CUSTOMER') => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1h' });
};

const runTests = async () => {
  let server;
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/the-anvor';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for Order Tests...');

    // Setup Test Data
    let userA = await User.findOne({ phone: '+91000000000A' });
    if (!userA) userA = await User.create({ phone: '+91000000000A', name: 'Order Test User A', passwordHash: 'test' });
    
    let userB = await User.findOne({ phone: '+91000000000B' });
    if (!userB) userB = await User.create({ phone: '+91000000000B', name: 'Order Test User B', passwordHash: 'test' });

    let category = await Category.findOne({ slug: 'test-category' });
    if (!category) category = await Category.create({ name: 'Test Category', slug: 'test-category', description: 'Test' });

    // Clean up previous test products/addresses/orders for clean slate
    await Product.deleteMany({ sku: { $in: ['TEST-ORDER-1', 'TEST-ORDER-2'] } });
    await Address.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await Order.deleteMany({ user: { $in: [userA._id, userB._id] } });
    await Cart.deleteMany({ user: { $in: [userA._id, userB._id] } });

    const productA = await Product.create({
      name: 'Order Test Product 1', slug: 'order-test-1', description: 'Test',
      price: 100, sku: 'TEST-ORDER-1', category: category._id, images: ['test1.jpg'],
      stockQuantity: 10, isActive: true
    });

    const productB = await Product.create({
      name: 'Order Test Product 2', slug: 'order-test-2', description: 'Test',
      price: 200, sku: 'TEST-ORDER-2', category: category._id, images: ['test2.jpg'],
      stockQuantity: 5, isActive: false // Notice this is INACTIVE
    });

    const addressA = await Address.create({
      user: userA._id, recipientName: 'User A', phone: '123', addressLine1: 'Line 1',
      city: 'City', state: 'State', postalCode: '12345', country: 'India'
    });

    const tokenA = generateToken(userA._id);
    const tokenB = generateToken(userB._id);

    console.log('--- STARTING ORDER TESTS ---');

    // 1. Auth required to create order
    console.log('Test 1: Auth required to create order');
    let res = await request(app).post('/api/orders').set('Origin', 'http://localhost:3000').send({ addressId: addressA._id, idempotencyKey: 'key1' });
    if (res.status !== 401) throw new Error(`Expected 401 Unauthorized for unauthenticated order creation, got ${res.status}: ${JSON.stringify(res.body)}`);

    // Setup Cart for User A
    await Cart.create({
      user: userA._id,
      items: [{ product: productA._id, quantity: 2 }] // 2 * 100 = 200
    });

    // 14. Invalid/nonexistent product prevents order creation (Using Product B which is inactive)
    console.log('Test 14, 15: Inactive/unpurchasable product prevents order creation');
    await Cart.updateOne({ user: userA._id }, { $push: { items: { product: productB._id, quantity: 1 } } });
    res = await request(app)
      .post('/api/orders')
      .set('Origin', 'http://localhost:3000')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ addressId: addressA._id, idempotencyKey: 'key2' });
    if (res.status !== 400 || !res.body.error.includes('no longer available')) {
      throw new Error(`Inactive product should prevent order creation, got status ${res.status} body ${JSON.stringify(res.body)}`);
    }
    
    // 13. Failed order does NOT clear the cart
    console.log('Test 13: Failed order does NOT clear the cart');
    let cartA = await Cart.findOne({ user: userA._id });
    if (cartA.items.length !== 2) throw new Error('Cart should not be cleared on failure');

    // Fix cart for User A
    await Cart.updateOne({ user: userA._id }, { $set: { items: [{ product: productA._id, quantity: 2 }] } });

    // 8. Address must belong to current user
    console.log('Test 8, 9: User A cannot create an order using User B\'s address');
    const addressB = await Address.create({
      user: userB._id, recipientName: 'User B', phone: '321', addressLine1: 'Line 1B',
      city: 'City', state: 'State', postalCode: '12345', country: 'India'
    });
    res = await request(app)
      .post('/api/orders')
      .set('Origin', 'http://localhost:3000')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ addressId: addressB._id, idempotencyKey: 'key3' });
    if (res.status !== 404) throw new Error('User A should not be able to use User B address');

    // 2. Authenticated user can create order (Successful case)
    // 6. Client cannot manipulate subtotal (by sending dummy totals)
    console.log('Test 2, 4, 5, 6, 7: Order Creation + Server Pricing + Snapshots');
    const idempotencyKeySuccess = 'success-key-1';
    res = await request(app)
      .post('/api/orders')
      .set('Origin', 'http://localhost:3000')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ 
        addressId: addressA._id, 
        idempotencyKey: idempotencyKeySuccess,
        subtotal: 9999, // Attempt to manipulate price
        items: [{ product: productA._id, unitPrice: 1, lineTotal: 1 }] // Attempt to manipulate items
      });
    
    if (res.status !== 201) throw new Error(`Order creation failed: ${JSON.stringify(res.body)}`);
    const orderId = res.body.data._id;
    const orderNumber = res.body.data.orderNumber;
    
    // 3, 4, 18. Correct snapshot stored and calculated by server
    const createdOrder = await Order.findById(orderId);
    if (createdOrder.subtotal !== 200 || createdOrder.grandTotal !== 200) {
      throw new Error('Server did not authoritative price calculate correctly');
    }
    if (createdOrder.items[0].unitPrice !== 100 || createdOrder.items[0].lineTotal !== 200) {
      throw new Error('Server did not snapshot correct unit prices');
    }
    if (createdOrder.shippingAddress.recipientName !== 'User A') {
      throw new Error('Address snapshot was not stored correctly');
    }

    // 12. Successful order clears the correct user's cart
    console.log('Test 12: Successful order clears the correct user\'s cart');
    cartA = await Cart.findOne({ user: userA._id });
    if (cartA.items.length !== 0) throw new Error('Cart was not cleared after successful order');

    // 16, 17. Statuses start correctly
    console.log('Test 16, 17: Statuses start correctly');
    if (createdOrder.status !== 'PENDING' || createdOrder.paymentStatus !== 'PENDING') {
      throw new Error('Order/Payment status did not start at PENDING');
    }

    // 21. Repeated request with the same idempotency key does not create duplicate orders.
    console.log('Test 21: Repeated request with same idempotency key');
    const resRepeat = await request(app)
      .post('/api/orders')
      .set('Origin', 'http://localhost:3000')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ addressId: addressA._id, idempotencyKey: idempotencyKeySuccess });
    if (resRepeat.status !== 200 || resRepeat.body.data._id !== orderId) {
      throw new Error('Idempotent request did not return existing order');
    }
    
    // Check cart is still empty (wasn't incorrectly refilled/errored)
    cartA = await Cart.findOne({ user: userA._id });
    if (cartA.items.length !== 0) throw new Error('Cart should remain empty on repeated idempotent request');

    // 10. User A cannot GET User B's order (via list)
    console.log('Test 10, 11: Cross-user order access prevention');
    let resB = await request(app).get('/api/orders').set('Origin', 'http://localhost:3000').set('Authorization', `Bearer ${tokenB}`);
    if (resB.body.data.length !== 0) throw new Error('User B should not see User A orders');

    // 11. User A cannot GET User B's order by ID
    resB = await request(app).get(`/api/orders/${orderId}`).set('Origin', 'http://localhost:3000').set('Authorization', `Bearer ${tokenB}`);
    if (resB.status !== 403) throw new Error('User B should be blocked from GET order by ID');

    // 23. User A's idempotency key reused by User B
    console.log('Test 23: Idempotency key cannot be hijacked by another user');
    resB = await request(app)
      .post('/api/orders')
      .set('Origin', 'http://localhost:3000')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ addressId: addressB._id, idempotencyKey: idempotencyKeySuccess });
    if (resB.status !== 403) throw new Error('User B should not be able to reuse User A idempotency key');

    // 19. Later address changes do not alter existing order
    // 20. Later product price changes do not alter existing order
    console.log('Test 19, 20: Snapshot durability against later mutations');
    await Address.updateOne({ _id: addressA._id }, { recipientName: 'User A Modified' });
    await Product.updateOne({ _id: productA._id }, { price: 999 });

    const fetchedOrder = await Order.findById(orderId);
    if (fetchedOrder.shippingAddress.recipientName === 'User A Modified') {
      throw new Error('Order address snapshot was mutated by address modification');
    }
    if (fetchedOrder.items[0].unitPrice === 999) {
      throw new Error('Order product snapshot was mutated by product modification');
    }

    // 22. Concurrent duplicate order attempts are handled safely
    // Since javascript is single threaded and Node's event loop handles concurrency, we can simulate it with Promise.all
    console.log('Test 22: Concurrent requests');
    await Cart.updateOne({ user: userA._id }, { $set: { items: [{ product: productA._id, quantity: 1 }] } });
    await Product.updateOne({ _id: productA._id }, { price: 100, isActive: true }); // Reset product
    
    const concurrentKey = 'concurrent-key-123';
    const req1 = request(app).post('/api/orders').set('Origin', 'http://localhost:3000').set('Authorization', `Bearer ${tokenA}`).send({ addressId: addressA._id, idempotencyKey: concurrentKey });
    const req2 = request(app).post('/api/orders').set('Origin', 'http://localhost:3000').set('Authorization', `Bearer ${tokenA}`).send({ addressId: addressA._id, idempotencyKey: concurrentKey });
    
    const [res1, res2] = await Promise.all([req1, req2]);
    // One should be 201 (created), other could be 200 (existing) or 201 depending on timing, 
    // but total orders created should be exactly 1 for this key.
    const concurrentOrders = await Order.find({ idempotencyKey: concurrentKey });
    if (concurrentOrders.length !== 1) {
      throw new Error(`Concurrent test failed. Expected 1 order, found ${concurrentOrders.length}`);
    }

    console.log('✅ ALL ORDER TESTS PASSED SUCCESSFULLY!');

  } catch (err) {
    console.error('❌ TEST FAILED:', err.message || err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
};

runTests();
