const Order = require('../models/Order');
const Product = require('../models/Product');

/**
 * Background job: Expire unpaid orders past their 20-minute payment window and restore stock.
 *
 * Runs on a setInterval inside the server process. No external scheduler needed.
 * Atomically transitions each eligible order from PENDING to EXPIRED so concurrent job
 * runners or requests never double-expire or double-restore stock.
 *
 * Criteria for expiry:
 *   - status === 'PENDING'
 *   - paymentStatus === 'PENDING'
 *   - expiresAt exists and is in the past
 */
async function expireStaleOrders() {
  try {
    const now = new Date();
    const staleOrders = await Order.find({
      status: 'PENDING',
      paymentStatus: 'PENDING',
      expiresAt: { $lte: now },
    });

    let expiredCount = 0;
    for (const order of staleOrders) {
      const updated = await Order.findOneAndUpdate(
        {
          _id: order._id,
          status: 'PENDING',
          paymentStatus: 'PENDING',
        },
        {
          $set: {
            status: 'EXPIRED',
            paymentStatus: 'FAILED',
            expiredAt: now,
          },
        },
        { returnDocument: 'after' }
      );

      if (updated) {
        expiredCount++;
        for (const item of updated.items) {
          if (item.product && item.quantity) {
            await Product.updateOne(
              { _id: item.product },
              { $inc: { stockQuantity: item.quantity } }
            );
          }
        }
      }
    }

    if (expiredCount > 0) {
      console.log(`[OrderExpiry] Expired ${expiredCount} stale order(s) and restored reserved stock at ${now.toISOString()}`);
    }
  } catch (err) {
    console.error('[OrderExpiry] Error expiring stale orders:', err);
  }
}

// Run every 2 minutes (120,000 ms)
const EXPIRY_INTERVAL_MS = 2 * 60 * 1000;

function startExpiryJob() {
  console.log('[OrderExpiry] Background job started — checking every 2 minutes');
  // Run once immediately on startup
  expireStaleOrders();
  // Then on interval
  return setInterval(expireStaleOrders, EXPIRY_INTERVAL_MS);
}

module.exports = { startExpiryJob, expireStaleOrders };
