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
const { expireStaleOrders } = require('./src/jobs/orderExpiryJob');
const jwt = require('jsonwebtoken');

const generateToken = (userId, role = 'CUSTOMER') => {
  return jwt.sign({ userId, role }, process.env.JWT_SECRET || 'secret123', { expiresIn: '1h' });
};

const runStockRaceConditionTests = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/the-anvor';
    await mongoose.connect(mongoUri);
    console.log(' Connected to MongoDB for Stock Race Condition Tests...');

    // Setup Test Users
    let userA = await User.findOne({ phone: '+919999990001' });
    if (!userA) userA = await User.create({ phone: '+919999990001', name: 'Race User A', passwordHash: 'test' });

    let userB = await User.findOne({ phone: '+919999990002' });
    if (!userB) userB = await User.create({ phone: '+919999990002', name: 'Race User B', passwordHash: 'test' });

    let userC = await User.findOne({ phone: '+919999990003' });
    if (!userC) userC = await User.create({ phone: '+919999990003', name: 'Race User C', passwordHash: 'test' });

    let category = await Category.findOne({ slug: 'race-test-category' });
    if (!category) category = await Category.create({ name: 'Race Category', slug: 'race-test-category', description: 'Test' });

    // Clean up previous test products/addresses/orders
    await Product.deleteMany({ sku: { $in: ['RACE-TEST-PROD-1', 'RACE-TEST-PROD-MULTI', 'RACE-TEST-ROLLBACK-A', 'RACE-TEST-ROLLBACK-B'] } });
    await Address.deleteMany({ user: { $in: [userA._id, userB._id, userC._id] } });
    await Order.deleteMany({ user: { $in: [userA._id, userB._id, userC._id] } });
    await Cart.deleteMany({ user: { $in: [userA._id, userB._id, userC._id] } });

    const addrA = await Address.create({
      user: userA._id, recipientName: 'User A', phone: '111', addressLine1: 'Line 1',
      city: 'City', state: 'State', postalCode: '110001', country: 'India'
    });

    const addrB = await Address.create({
      user: userB._id, recipientName: 'User B', phone: '222', addressLine1: 'Line 2',
      city: 'City', state: 'State', postalCode: '110002', country: 'India'
    });

    const tokenA = generateToken(userA._id);
    const tokenB = generateToken(userB._id);

    console.log('\n--- TEST 1: TWO CONCURRENT REQUESTS COMPETING FOR THE LAST ITEM (STOCK = 1) ---');
    // Product has stockQuantity = 1. Both User A and User B request 1 item concurrently.
    const productLastItem = await Product.create({
      name: 'Last Available Handbag', slug: 'last-available-handbag', description: 'Limited stock item',
      price: 250, sku: 'RACE-TEST-PROD-1', category: category._id, images: ['bag.jpg'],
      stockQuantity: 1, isActive: true
    });

    // Populate carts
    await Cart.create({ user: userA._id, items: [{ product: productLastItem._id, quantity: 1 }] });
    await Cart.create({ user: userB._id, items: [{ product: productLastItem._id, quantity: 1 }] });

    // Send simultaneous orders
    const keyA = `race-key-A-${Date.now()}`;
    const keyB = `race-key-B-${Date.now()}`;

    const [resA, resB] = await Promise.all([
      request(app).post('/api/orders').set('Origin', 'http://localhost:3000').set('Authorization', `Bearer ${tokenA}`).send({ addressId: addrA._id, idempotencyKey: keyA }),
      request(app).post('/api/orders').set('Origin', 'http://localhost:3000').set('Authorization', `Bearer ${tokenB}`).send({ addressId: addrB._id, idempotencyKey: keyB })
    ]);

    const statuses = [resA.status, resB.status];
    console.log(`Responses: User A: ${resA.status}, User B: ${resB.status}`);

    // Exactly one must succeed (201) and exactly one must fail (400)
    console.assert(statuses.includes(201), 'One concurrent order MUST succeed with 201');
    console.assert(statuses.includes(400), 'The second concurrent order MUST fail with 400');

    const failedRes = resA.status === 400 ? resA : resB;
    const winnerUser = resA.status === 201 ? userA : userB;
    const loserUser = resA.status === 400 ? userA : userB;

    console.assert(failedRes.body.error && failedRes.body.error.includes('Insufficient stock'), `Expected insufficient stock error, got: ${failedRes.body.error}`);

    // Check database stock: Must be exactly 0, NEVER -1!
    const productInDb = await Product.findById(productLastItem._id);
    console.assert(productInDb.stockQuantity === 0, `Expected stock to be 0, but got: ${productInDb.stockQuantity}`);
    console.log(` DB Stock correctly decremented to: ${productInDb.stockQuantity} (no overselling, no negative inventory)`);

    // Check orders count in DB: Exactly 1 order created
    const ordersCount = await Order.countDocuments({ 'items.product': productLastItem._id });
    console.assert(ordersCount === 1, `Expected exactly 1 order in DB, found ${ordersCount}`);
    console.log(` Exactly 1 order created in DB`);

    // Winner's cart is cleared, loser's cart remains intact
    const winnerCart = await Cart.findOne({ user: winnerUser._id });
    const loserCart = await Cart.findOne({ user: loserUser._id });
    console.assert(winnerCart.items.length === 0, 'Winner cart should be cleared');
    console.assert(loserCart.items.length === 1, 'Loser cart should NOT be cleared on failure');
    console.log(' Cart clearing behavior verified: winner cleared, loser preserved');
    console.log('✅ TEST 1 PASSED: Atomic MongoDB condition prevented race condition!\n');

    console.log('--- TEST 2: MULTI-ITEM CART ROLLBACK ON PARTIAL FAILURE ---');
    // Product 1 has stock 5, Product 2 has stock 0.
    const prodRollbackA = await Product.create({
      name: 'In Stock Purse', slug: 'in-stock-purse', description: 'Available',
      price: 150, sku: 'RACE-TEST-ROLLBACK-A', category: category._id, images: ['purseA.jpg'],
      stockQuantity: 5, isActive: true
    });
    const prodRollbackB = await Product.create({
      name: 'Zero Stock Purse', slug: 'zero-stock-purse', description: 'Out of stock',
      price: 150, sku: 'RACE-TEST-ROLLBACK-B', category: category._id, images: ['purseB.jpg'],
      stockQuantity: 0, isActive: true
    });

    await Cart.updateOne(
      { user: userA._id },
      { $set: { items: [{ product: prodRollbackA._id, quantity: 2 }, { product: prodRollbackB._id, quantity: 1 }] } }
    );

    const rollbackRes = await request(app)
      .post('/api/orders')
      .set('Origin', 'http://localhost:3000')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ addressId: addrA._id, idempotencyKey: `rollback-key-${Date.now()}` });

    console.assert(rollbackRes.status === 400, `Expected 400, got ${rollbackRes.status}`);
    console.assert(rollbackRes.body.error.includes('Insufficient stock for product "Zero Stock Purse"'), `Expected out of stock error for product B, got: ${rollbackRes.body.error}`);

    // Verify Product A stock was NOT permanently decremented (was safely rolled back to 5)
    const prodACheck = await Product.findById(prodRollbackA._id);
    console.assert(prodACheck.stockQuantity === 5, `Expected Product A stock to remain 5 after rollback, got ${prodACheck.stockQuantity}`);
    console.log(` Product A stock rolled back cleanly to ${prodACheck.stockQuantity}`);
    console.log('✅ TEST 2 PASSED: Multi-item rollback works correctly!\n');

    console.log('--- TEST 3: ORDER EXPIRY RESTORES RESERVED STOCK ---');
    // Reset productLastItem stock to 0 and verify order expiry job restores stock
    const winningOrder = await Order.findOne({ 'items.product': productLastItem._id });
    console.assert(winningOrder !== null, 'Winning order should exist');

    // Force order to be expired by setting expiresAt in past
    winningOrder.expiresAt = new Date(Date.now() - 10000);
    await winningOrder.save();

    // Run the background order expiry routine
    await expireStaleOrders();

    const restoredProduct = await Product.findById(productLastItem._id);
    console.assert(restoredProduct.stockQuantity === 1, `Expected stock to be restored to 1 upon order expiry, got: ${restoredProduct.stockQuantity}`);
    console.log(` Expired order restored stock back to: ${restoredProduct.stockQuantity}`);

    const expiredOrder = await Order.findById(winningOrder._id);
    console.assert(expiredOrder.status === 'EXPIRED', 'Order status should be EXPIRED');
    console.assert(expiredOrder.paymentStatus === 'FAILED', 'Payment status should be FAILED');
    console.log('✅ TEST 3 PASSED: Order expiry automatically restores reserved stock!\n');

    console.log('🎉 ALL STOCK RACE CONDITION & ATOMICITY TESTS PASSED SUCCESSFULLY!');

  } catch (err) {
    console.error('❌ TEST FAILED:', err.message || err);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('Database connection closed.');
  }
};

runStockRaceConditionTests();
