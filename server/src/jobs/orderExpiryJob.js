const Order = require('../models/Order');

/**
 * Background job: Expire unpaid orders past their 20-minute payment window.
 *
 * Runs on a setInterval inside the server process. No external scheduler needed.
 * Uses an atomic updateMany so it's safe even if multiple server instances run.
 *
 * Criteria for expiry:
 *   - status === 'PENDING'
 *   - paymentStatus === 'PENDING'
 *   - expiresAt exists and is in the past
 */
async function expireStaleOrders() {
  try {
    const now = new Date();
    const result = await Order.updateMany(
      {
        status: 'PENDING',
        paymentStatus: 'PENDING',
        expiresAt: { $lte: now },
      },
      {
        $set: {
          status: 'EXPIRED',
          paymentStatus: 'FAILED',
          expiredAt: now,
        },
      }
    );

    if (result.modifiedCount > 0) {
      console.log(`[OrderExpiry] Expired ${result.modifiedCount} stale order(s) at ${now.toISOString()}`);
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
