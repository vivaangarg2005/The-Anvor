require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');

const seedDB = async () => {
  try {
    console.log('Connecting to database...');
    const directUri = "mongodb://store_admin:YfM4HoYFQKx2lut4@ac-iiskqid-shard-00-00.xrb8nbj.mongodb.net:27017,ac-iiskqid-shard-00-01.xrb8nbj.mongodb.net:27017,ac-iiskqid-shard-00-02.xrb8nbj.mongodb.net:27017/purse_store?ssl=true&replicaSet=atlas-iiskqid-shard-0&authSource=admin&retryWrites=true&w=majority";
    await mongoose.connect(directUri, { family: 4 });
    
    console.log('Clearing old data...');
    await Product.deleteMany();
    await Category.deleteMany();

    console.log('Inserting categories...');
    const categories = await Category.insertMany([
      { name: 'Handbags', slug: 'handbags', description: 'Everyday handbags' },
      { name: 'Shoulder Bags', slug: 'shoulder-bags', description: 'Over the shoulder bags' },
      { name: 'Tote Bags', slug: 'tote-bags', description: 'Spacious tote bags' }
    ]);

    const getCatId = (name) => categories.find(c => c.name === name)._id;

    console.log('Inserting products...');
    await Product.insertMany([
      {
        name: 'Classic Noir Handbag',
        slug: 'classic-noir-handbag',
        description: 'A timeless black leather handbag suitable for any occasion.',
        price: 4500,
        compareAtPrice: 5000,
        sku: 'HB-NOIR-001',
        category: getCatId('Handbags'),
        images: ['https://via.placeholder.com/400x400?text=Noir+Handbag'],
        stockQuantity: 15,
        isActive: true,
        attributes: { material: 'Leather', color: 'Black' }
      },
      {
        name: 'Everyday Tan Tote',
        slug: 'everyday-tan-tote',
        description: 'Spacious and durable tote bag for daily use.',
        price: 3200,
        sku: 'TB-TAN-002',
        category: getCatId('Tote Bags'),
        images: ['https://via.placeholder.com/400x400?text=Tan+Tote'],
        stockQuantity: 8,
        isActive: true,
        isFeatured: true,
        attributes: { material: 'Canvas', color: 'Tan' }
      },
      {
        name: 'Minimal Pearl Shoulder Bag',
        slug: 'minimal-pearl-shoulder-bag',
        description: 'Elegant and compact shoulder bag.',
        price: 2800,
        sku: 'SB-PRL-003',
        category: getCatId('Shoulder Bags'),
        images: ['https://via.placeholder.com/400x400?text=Pearl+Shoulder+Bag'],
        stockQuantity: 0, // Specifically testing out-of-stock scenario
        isActive: true,
        attributes: { material: 'PU Leather', color: 'Pearl White' }
      },
      {
        name: 'Crimson Leather Satchel',
        slug: 'crimson-leather-satchel',
        description: 'A bold statement piece in premium crimson leather.',
        price: 5200,
        sku: 'HB-CRM-004',
        category: getCatId('Handbags'),
        images: ['https://via.placeholder.com/400x400?text=Crimson+Satchel'],
        stockQuantity: 12,
        isActive: true,
        attributes: { material: 'Leather', color: 'Crimson' }
      },
      {
        name: 'Navy Weekend Tote',
        slug: 'navy-weekend-tote',
        description: 'Perfect for short trips or heavy daily carries.',
        price: 3600,
        sku: 'TB-NVY-005',
        category: getCatId('Tote Bags'),
        images: ['https://via.placeholder.com/400x400?text=Navy+Weekend+Tote'],
        stockQuantity: 20,
        isActive: true,
        attributes: { material: 'Canvas', color: 'Navy Blue' }
      },
      {
        name: 'Blush Pink Crossbody',
        slug: 'blush-pink-crossbody',
        description: 'Light and playful shoulder bag for casual outings.',
        price: 2400,
        sku: 'SB-BLSH-006',
        category: getCatId('Shoulder Bags'),
        images: ['https://via.placeholder.com/400x400?text=Blush+Crossbody'],
        stockQuantity: 18,
        isActive: true,
        attributes: { material: 'Vegan Leather', color: 'Blush Pink' }
      },
      {
        name: 'Olive Green Work Tote',
        slug: 'olive-green-work-tote',
        description: 'Professional tote bag with laptop compartment.',
        price: 4800,
        sku: 'TB-OLV-007',
        category: getCatId('Tote Bags'),
        images: ['https://via.placeholder.com/400x400?text=Olive+Work+Tote'],
        stockQuantity: 5,
        isActive: true,
        attributes: { material: 'Leather', color: 'Olive Green' }
      },
      {
        name: 'Emerald City Handbag',
        slug: 'emerald-city-handbag',
        description: 'Sophisticated handbag in deep emerald green.',
        price: 5500,
        compareAtPrice: 6000,
        sku: 'HB-EMR-008',
        category: getCatId('Handbags'),
        images: ['https://via.placeholder.com/400x400?text=Emerald+Handbag'],
        stockQuantity: 7,
        isActive: true,
        attributes: { material: 'Leather', color: 'Emerald' }
      },
      {
        name: 'Mustard Yellow Slouch Bag',
        slug: 'mustard-yellow-slouch-bag',
        description: 'Comfortable and roomy casual shoulder bag.',
        price: 2900,
        sku: 'SB-MST-009',
        category: getCatId('Shoulder Bags'),
        images: ['https://via.placeholder.com/400x400?text=Mustard+Slouch'],
        stockQuantity: 14,
        isActive: true,
        attributes: { material: 'Suede', color: 'Mustard' }
      },
      {
        name: 'Monochrome Canvas Tote',
        slug: 'monochrome-canvas-tote',
        description: 'Simple black and white design for everyday use.',
        price: 1800,
        sku: 'TB-MNC-010',
        category: getCatId('Tote Bags'),
        images: ['https://via.placeholder.com/400x400?text=Monochrome+Tote'],
        stockQuantity: 30,
        isActive: true,
        attributes: { material: 'Canvas', color: 'Black/White' }
      },
      {
        name: 'Burgundy Structured Handbag',
        slug: 'burgundy-structured-handbag',
        description: 'Rigid structure for a sharp, professional look.',
        price: 6200,
        sku: 'HB-BRG-011',
        category: getCatId('Handbags'),
        images: ['https://via.placeholder.com/400x400?text=Burgundy+Handbag'],
        stockQuantity: 4,
        isActive: true,
        isFeatured: true,
        attributes: { material: 'Premium Leather', color: 'Burgundy' }
      },
      {
        name: 'Sky Blue Mini Shoulder Bag',
        slug: 'sky-blue-mini-shoulder-bag',
        description: 'Compact bag for essentials only.',
        price: 2100,
        sku: 'SB-SKY-012',
        category: getCatId('Shoulder Bags'),
        images: ['https://via.placeholder.com/400x400?text=Sky+Blue+Mini'],
        stockQuantity: 22,
        isActive: true,
        attributes: { material: 'PU Leather', color: 'Sky Blue' }
      },
      {
        name: 'Charcoal Grey Carryall',
        slug: 'charcoal-grey-carryall',
        description: 'Massive tote that fits literally everything.',
        price: 3900,
        sku: 'TB-CHR-013',
        category: getCatId('Tote Bags'),
        images: ['https://via.placeholder.com/400x400?text=Charcoal+Carryall'],
        stockQuantity: 11,
        isActive: true,
        attributes: { material: 'Canvas/Leather', color: 'Charcoal' }
      },
      {
        name: 'Taupe Suede Handbag',
        slug: 'taupe-suede-handbag',
        description: 'Soft texture with gold-tone hardware.',
        price: 4900,
        sku: 'HB-TPE-014',
        category: getCatId('Handbags'),
        images: ['https://via.placeholder.com/400x400?text=Taupe+Suede+Handbag'],
        stockQuantity: 9,
        isActive: true,
        attributes: { material: 'Suede', color: 'Taupe' }
      },
      {
        name: 'Rose Gold Chain Bag',
        slug: 'rose-gold-chain-bag',
        description: 'Shoulder bag featuring an elegant rose gold chain.',
        price: 3500,
        sku: 'SB-RSG-015',
        category: getCatId('Shoulder Bags'),
        images: ['https://via.placeholder.com/400x400?text=Rose+Gold+Chain'],
        stockQuantity: 6,
        isActive: true,
        attributes: { material: 'PU Leather', color: 'Rose Gold' }
      },
      {
        name: 'Ivory Summer Tote',
        slug: 'ivory-summer-tote',
        description: 'Lightweight and breezy for warm days.',
        price: 2500,
        sku: 'TB-IVY-016',
        category: getCatId('Tote Bags'),
        images: ['https://via.placeholder.com/400x400?text=Ivory+Summer+Tote'],
        stockQuantity: 25,
        isActive: true,
        attributes: { material: 'Cotton Blend', color: 'Ivory' }
      },
      {
        name: 'Aubergine Hobo Bag',
        slug: 'aubergine-hobo-bag',
        description: 'Slouchy, comfortable, and chic.',
        price: 3300,
        sku: 'HB-AUB-017',
        category: getCatId('Handbags'),
        images: ['https://via.placeholder.com/400x400?text=Aubergine+Hobo'],
        stockQuantity: 16,
        isActive: true,
        attributes: { material: 'Vegan Leather', color: 'Aubergine' }
      },
      {
        name: 'Teal Envelope Shoulder Bag',
        slug: 'teal-envelope-shoulder-bag',
        description: 'Sleek envelope design perfect for evenings.',
        price: 2700,
        sku: 'SB-TEA-018',
        category: getCatId('Shoulder Bags'),
        images: ['https://via.placeholder.com/400x400?text=Teal+Envelope'],
        stockQuantity: 10,
        isActive: true,
        attributes: { material: 'Leather', color: 'Teal' }
      },
      {
        name: 'Rustic Brown Market Tote',
        slug: 'rustic-brown-market-tote',
        description: 'Unlined leather tote that ages beautifully.',
        price: 5800,
        compareAtPrice: 6500,
        sku: 'TB-RST-019',
        category: getCatId('Tote Bags'),
        images: ['https://via.placeholder.com/400x400?text=Rustic+Market+Tote'],
        stockQuantity: 3, // Low stock
        isActive: true,
        attributes: { material: 'Full Grain Leather', color: 'Rustic Brown' }
      },
      {
        name: 'Silver Metallic Clutch',
        slug: 'silver-metallic-clutch',
        description: 'Small shoulder bag that converts to a clutch.',
        price: 3100,
        sku: 'SB-SLV-020',
        category: getCatId('Shoulder Bags'),
        images: ['https://via.placeholder.com/400x400?text=Silver+Metallic'],
        stockQuantity: 13,
        isActive: true,
        attributes: { material: 'Synthetic', color: 'Silver' }
      },
      {
        name: 'Midnight Blue Doctor Bag',
        slug: 'midnight-blue-doctor-bag',
        description: 'Vintage-inspired shape with modern details.',
        price: 4700,
        sku: 'HB-MID-021',
        category: getCatId('Handbags'),
        images: ['https://via.placeholder.com/400x400?text=Midnight+Doctor+Bag'],
        stockQuantity: 8,
        isActive: true,
        attributes: { material: 'Leather', color: 'Midnight Blue' }
      },
      {
        name: 'Lavender Woven Tote',
        slug: 'lavender-woven-tote',
        description: 'Intricate woven design in a soft pastel hue.',
        price: 4200,
        sku: 'TB-LAV-022',
        category: getCatId('Tote Bags'),
        images: ['https://via.placeholder.com/400x400?text=Lavender+Woven+Tote'],
        stockQuantity: 0, // Testing another out-of-stock
        isActive: true,
        attributes: { material: 'Woven Vegan Leather', color: 'Lavender' }
      },
      {
        name: 'Cognac Saddle Bag',
        slug: 'cognac-saddle-bag',
        description: 'Classic saddle silhouette for everyday wear.',
        price: 3800,
        sku: 'SB-COG-023',
        category: getCatId('Shoulder Bags'),
        images: ['https://via.placeholder.com/400x400?text=Cognac+Saddle+Bag'],
        stockQuantity: 19,
        isActive: true,
        isFeatured: true,
        attributes: { material: 'Leather', color: 'Cognac' }
      }
    ]);

    console.log('✅ Seed complete!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seed error:', error);
    process.exit(1);
  }
};

seedDB();
