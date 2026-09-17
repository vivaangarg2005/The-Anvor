require('dotenv').config();
const dns = require('dns');
dns.setServers(['8.8.8.8', '1.1.1.1']);
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Category = require('./models/Category');
const Product = require('./models/Product');
const User = require('./models/User');

const seedData = async () => {
  try {
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/the-anvor';
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB for seeding...');

    // Clear existing products and categories
    await Category.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared existing categories and products.');

    // 1. Create Categories
    const categories = await Category.insertMany([
      {
        name: 'Handbags',
        slug: 'handbags',
        description: 'Structured, timeless leather handbags crafted for daily elegance.',
      },
      {
        name: 'Tote Bags',
        slug: 'tote-bags',
        description: 'Spacious, versatile totes tailored for work, travel, and leisure.',
      },
      {
        name: 'Shoulder Bags',
        slug: 'shoulder-bags',
        description: 'Sleek shoulder silhouettes with signature metallic gold accents.',
      },
      {
        name: 'Evening Clutches',
        slug: 'clutches',
        description: 'Refined evening clutches designed to complement black-tie attire.',
      },
    ]);

    const catMap = {};
    categories.forEach((cat) => {
      catMap[cat.slug] = cat._id;
    });

    // 2. Create Products
    const products = [
      {
        name: 'The Anvor Sovereign Tote',
        slug: 'anvor-sovereign-tote',
        description: 'Handcrafted from full-grain calfskin leather with polished champagne gold hardware. Includes a suede-lined interior and dedicated laptop sleeve.',
        price: 24999,
        compareAtPrice: 29999,
        sku: 'ANV-TOT-001',
        category: catMap['tote-bags'],
        images: [
          'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&auto=format&fit=crop',
          'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop',
        ],
        stockQuantity: 15,
        isFeatured: true,
        attributes: { Material: 'Full-Grain Leather', Color: 'Warm Ivory', Hardware: 'Champagne Gold' },
      },
      {
        name: 'Royal Heritage Satchel',
        slug: 'royal-heritage-satchel',
        description: 'An architectural silhouette featuring structured corners, dual top handles, and a detachable crossbody strap.',
        price: 18499,
        compareAtPrice: 22000,
        sku: 'ANV-SAT-002',
        category: catMap['handbags'],
        images: [
          'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&auto=format&fit=crop',
        ],
        stockQuantity: 8,
        isFeatured: true,
        attributes: { Material: 'Textured Pebble Leather', Color: 'Earthy Espresso' },
      },
      {
        name: 'Elysian Chain Shoulder Bag',
        slug: 'elysian-chain-shoulder-bag',
        description: 'Supple quilted leather with a convertible gold chain strap, ideal for effortless day-to-night styling.',
        price: 15999,
        compareAtPrice: 19500,
        sku: 'ANV-SHL-003',
        category: catMap['shoulder-bags'],
        images: [
          'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&auto=format&fit=crop',
        ],
        stockQuantity: 12,
        isFeatured: true,
        attributes: { Material: 'Nappa Leather', Color: 'Rich Cognac' },
      },
      {
        name: 'Aurelia Evening Minaudière',
        slug: 'aurelia-evening-minaudiere',
        description: 'An exquisite hard-shell evening clutch adorned with subtle brushed gold framing and magnetic clasp closure.',
        price: 12999,
        compareAtPrice: 16000,
        sku: 'ANV-CLU-004',
        category: catMap['clutches'],
        images: [
          'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&auto=format&fit=crop',
        ],
        stockQuantity: 5,
        isFeatured: false,
        attributes: { Material: 'Satin & Brushed Brass', Color: 'Champagne' },
      },
      {
        name: 'Monarch Crossbody Bag',
        slug: 'monarch-crossbody-bag',
        description: 'Minimalist curved silhouette designed for lightweight daily essentials with an adjustable leather strap.',
        price: 11999,
        compareAtPrice: 14500,
        sku: 'ANV-CRB-005',
        category: catMap['shoulder-bags'],
        images: [
          'https://images.unsplash.com/photo-1600857544200-b2f666a9a2ec?w=800&auto=format&fit=crop',
        ],
        stockQuantity: 20,
        isFeatured: false,
        attributes: { Material: 'Calfskin Leather', Color: 'Soft Taupe' },
      },
      {
        name: 'Vanguard Carryall Tote',
        slug: 'vanguard-carryall-tote',
        description: 'Clean geometry and unlined luxury leather finish make this tote the ultimate everyday statement piece.',
        price: 21999,
        compareAtPrice: 26000,
        sku: 'ANV-TOT-006',
        category: catMap['tote-bags'],
        images: [
          'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&auto=format&fit=crop',
        ],
        stockQuantity: 10,
        isFeatured: false,
        attributes: { Material: 'Full-Grain Leather', Color: 'Deep Onyx' },
      },
    ];

    await Product.insertMany(products);
    console.log(`Successfully seeded ${products.length} luxury products and ${categories.length} categories.`);

    // 3. Ensure Admin user exists
    const adminPhone = '+919999999999';
    const existingAdmin = await User.findOne({ phone: adminPhone });
    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash('admin123456', 10);
      await User.create({
        name: 'The Anvor Admin',
        phone: adminPhone,
        email: 'admin@theanvor.com',
        passwordHash,
        role: 'ADMIN',
        phoneVerified: true,
      });
      console.log('Admin user created successfully (Phone: +919999999999 / Pass: admin123456 / Email: admin@theanvor.com)');
    } else {
      console.log('Admin user already exists.');
    }

    console.log('Seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
