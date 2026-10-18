const Order = require('../models/Order');
const Product = require('../models/Product');

exports.getAdminOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const query = {};
    
    if (req.query.status) {
      query.status = req.query.status;
    }
    
    if (req.query.paymentStatus) {
      query.paymentStatus = req.query.paymentStatus;
    }

    const totalCount = await Order.countDocuments(query);
    const orders = await Order.find(query)
      .populate('user', 'name email phone')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      count: orders.length,
      data: orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalCount / limit),
        totalCount
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getAdminOrderById = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('user', 'name email phone');
      
    if (!order) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }
    
    res.json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

exports.updateAdminOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    // Explicitly validate against the allowed enum values from the model
    const allowedStatuses = ['PENDING', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'EXPIRED'];
    
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: `Invalid status. Must be one of: ${allowedStatuses.join(', ')}` 
      });
    }

    const currentOrder = await Order.findById(req.params.id);
    if (!currentOrder) {
      return res.status(404).json({ success: false, error: 'Order not found' });
    }

    // If cancelling or expiring an order that was previously active, restore stock
    if (
      (status === 'CANCELLED' || status === 'EXPIRED') &&
      currentOrder.status !== 'CANCELLED' &&
      currentOrder.status !== 'EXPIRED'
    ) {
      for (const item of currentOrder.items) {
        if (item.product && item.quantity) {
          await Product.updateOne(
            { _id: item.product },
            { $inc: { stockQuantity: item.quantity } }
          );
        }
      }
    }

    // If reactivating a cancelled/expired order, attempt to re-reserve stock atomically
    if (
      (currentOrder.status === 'CANCELLED' || currentOrder.status === 'EXPIRED') &&
      status !== 'CANCELLED' &&
      status !== 'EXPIRED'
    ) {
      const reReserved = [];
      for (const item of currentOrder.items) {
        const prod = await Product.findOneAndUpdate(
          { _id: item.product, stockQuantity: { $gte: item.quantity } },
          { $inc: { stockQuantity: -item.quantity } },
          { returnDocument: 'after' }
        );
        if (!prod) {
          // Rollback partial re-reservations
          for (const r of reReserved) {
            await Product.updateOne({ _id: r.productId }, { $inc: { stockQuantity: r.quantity } });
          }
          return res.status(400).json({
            success: false,
            error: `Cannot reactivate order: insufficient stock for product "${item.productName || item.product}".`,
          });
        }
        reReserved.push({ productId: item.product, quantity: item.quantity });
      }
    }

    currentOrder.status = status;
    if (status === 'EXPIRED') {
      currentOrder.paymentStatus = 'FAILED';
      currentOrder.expiredAt = new Date();
    }
    await currentOrder.save();

    await currentOrder.populate('user', 'name email phone');
    res.json({ success: true, data: currentOrder });
  } catch (error) {
    next(error);
  }
};
