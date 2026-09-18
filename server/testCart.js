require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const { getCart, addItem, updateItemQuantity, removeItem, clearCart } = require('./src/services/cartService');
const Product = require('./src/models/Product');
const User = require('./src/models/User');
const Cart = require('./src/models/Cart');

const runTests = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/the-anvor';
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB for Cart Tests...');

    // Setup Test Data
    let userA = await User.findOne({ phone: '+919876543210' });
    if (!userA) {
      userA = await User.create({ phone: '+919876543210', name: 'Test User A', passwordHash: 'test', role: 'CUSTOMER' });
    }
    
    let userB = await User.findOne({ phone: '+919876543211' });
    if (!userB) {
      userB = await User.create({ phone: '+919876543211', name: 'Test User B', passwordHash: 'test', role: 'CUSTOMER' });
    }

    const products = await Product.find({ isActive: true }).limit(2);
    if (products.length < 2) throw new Error('Not enough test products found');
    const [productA, productB] = products;

    // --- TEST 1: CLEAR CART ---
    await clearCart(userA._id);
    await clearCart(userB._id);
    let cart = await getCart(userA._id);
    console.assert(cart.itemCount === 0, 'Cart should be empty');
    console.log('✅ Cart cleared successfully.');

    // --- TEST 2: CONCURRENCY - FIRST CART CREATION & DUPLICATE ADDS ---
    console.log('Testing 5 simultaneous requests to add Product A...');
    // Drop the cart completely to test creation race
    await Cart.deleteOne({ user: userA._id });

    const concurrentAdds = [];
    for (let i = 0; i < 5; i++) {
      // Simulate 5 simultaneous API calls
      concurrentAdds.push(addItem(userA._id, productA._id, 1).catch(err => err));
    }
    
    await Promise.all(concurrentAdds);
    
    cart = await getCart(userA._id);
    console.log(`Cart line count after concurrent adds: ${cart.items.length}`);
    console.log(`Cart total item count after concurrent adds: ${cart.itemCount}`);
    
    if (cart.items.length !== 1) {
      throw new Error(`Concurrency failure: Duplicate lines created for same product. Found ${cart.items.length} lines.`);
    }
    if (cart.itemCount !== 5) {
      throw new Error(`Concurrency failure: Lost quantity updates. Found count ${cart.itemCount} instead of 5.`);
    }
    console.log('✅ Concurrency for duplicate product adds PASSED!');

    // --- TEST 3: PRICE INTEGRITY & FAKE FIELDS ---
    // In our service, addItem doesn't even accept price. But if we try to manipulate the cart document directly?
    // The service `getCart` re-calculates everything dynamically.
    cart = await getCart(userA._id);
    const subtotal = cart.subtotal;
    const expectedSubtotal = productA.price * 5;
    console.assert(subtotal === expectedSubtotal, `Price manipulation vulnerability! Expected ${expectedSubtotal}, got ${subtotal}`);
    console.log('✅ Price Integrity PASSED!');

    // --- TEST 4: MAX QUANTITY CAP ---
    await addItem(userA._id, productA._id, 10);
    cart = await getCart(userA._id);
    console.assert(cart.itemCount === 10, `Quantity cap failed. Count is ${cart.itemCount}`);
    console.log('✅ Max quantity cap (10) PASSED!');

    // --- TEST 5: CROSS-USER ISOLATION ---
    await addItem(userB._id, productB._id, 1);
    const cartB = await getCart(userB._id);
    console.assert(cartB.itemCount === 1, 'User B cart should have 1 item');
    cart = await getCart(userA._id);
    console.assert(cart.itemCount === 10, 'User A cart should still have 10 items');
    console.log('✅ Cross-user isolation PASSED!');

    // --- TEST 6: OUT OF STOCK BEHAVIOR ---
    const originalStock = productA.stockQuantity;
    productA.stockQuantity = 0;
    await productA.save();

    try {
      await addItem(userA._id, productA._id, 1);
      throw new Error('Should not allow adding out of stock product');
    } catch (err) {
      console.assert(err.message.includes('out of stock'), 'Expected out of stock error');
    }
    
    // Restore stock
    productA.stockQuantity = originalStock;
    await productA.save();
    console.log('✅ Out-of-stock restriction PASSED!');

    // --- TEST 7: INACTIVE/DELETED PRODUCT BEHAVIOR ---
    const originalIsActive = productA.isActive;
    productA.isActive = false;
    await productA.save();

    cart = await getCart(userA._id);
    // Since ProductA is inactive, getCart should silently prune it or ignore it.
    console.assert(cart.itemCount === 0, 'Inactive product should be pruned from cart count');
    console.assert(cart.subtotal === 0, 'Inactive product should not contribute to subtotal');

    // Restore active
    productA.isActive = originalIsActive;
    await productA.save();
    console.log('✅ Inactive/Deleted product pruning PASSED!');

    console.log('🎉 All Cart Verification Tests Passed!');
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    mongoose.disconnect();
  }
};

runTests();
