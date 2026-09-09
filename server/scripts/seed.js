require('dotenv').config({ path: __dirname + '/../.env' });
const mongoose = require('mongoose');
const Category = require('../src/models/Category');
const Product = require('../src/models/Product');

const seedDB = async () => {
  try {
    console.log('Connecting to database...');
    await mongoose.connect(process.env.MONGODB_URI);
    
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
