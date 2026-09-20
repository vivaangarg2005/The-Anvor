const newProducts = [
  {
    name: 'Crimson Leather Satchel',
    slug: 'crimson-leather-satchel',
    description: 'A bold statement piece in premium crimson leather.',
    price: 5200,
    sku: 'HB-CRM-004',
    categoryName: 'Handbags',
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
    categoryName: 'Tote Bags',
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
    categoryName: 'Shoulder Bags',
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
    categoryName: 'Tote Bags',
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
    categoryName: 'Handbags',
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
    categoryName: 'Shoulder Bags',
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
    categoryName: 'Tote Bags',
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
    categoryName: 'Handbags',
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
    categoryName: 'Shoulder Bags',
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
    categoryName: 'Tote Bags',
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
    categoryName: 'Handbags',
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
    categoryName: 'Shoulder Bags',
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
    categoryName: 'Tote Bags',
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
    categoryName: 'Handbags',
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
    categoryName: 'Shoulder Bags',
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
    categoryName: 'Tote Bags',
    images: ['https://via.placeholder.com/400x400?text=Rustic+Market+Tote'],
    stockQuantity: 3,
    isActive: true,
    attributes: { material: 'Full Grain Leather', color: 'Rustic Brown' }
  },
  {
    name: 'Silver Metallic Clutch',
    slug: 'silver-metallic-clutch',
    description: 'Small shoulder bag that converts to a clutch.',
    price: 3100,
    sku: 'SB-SLV-020',
    categoryName: 'Shoulder Bags',
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
    categoryName: 'Handbags',
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
    categoryName: 'Tote Bags',
    images: ['https://via.placeholder.com/400x400?text=Lavender+Woven+Tote'],
    stockQuantity: 0,
    isActive: true,
    attributes: { material: 'Woven Vegan Leather', color: 'Lavender' }
  },
  {
    name: 'Cognac Saddle Bag',
    slug: 'cognac-saddle-bag',
    description: 'Classic saddle silhouette for everyday wear.',
    price: 3800,
    sku: 'SB-COG-023',
    categoryName: 'Shoulder Bags',
    images: ['https://via.placeholder.com/400x400?text=Cognac+Saddle+Bag'],
    stockQuantity: 19,
    isActive: true,
    isFeatured: true,
    attributes: { material: 'Leather', color: 'Cognac' }
  }
];

async function addProducts() {
  try {
    const catsRes = await fetch('http://localhost:5000/api/categories');
    const catsData = await catsRes.json();
    const categories = catsData.data;

    let addedCount = 0;
    for (const p of newProducts) {
      const catId = categories.find(c => c.name === p.categoryName)?._id;
      if (!catId) {
        console.error('Could not find category for', p.categoryName);
        continue;
      }
      
      const pToPost = { ...p, category: catId };
      delete pToPost.categoryName;
      
      const res = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3000'
        },
        body: JSON.stringify(pToPost)
      });
      if (res.ok) {
        addedCount++;
        console.log('Added', p.name);
      } else {
        const error = await res.json();
        if (error.error && error.error.includes('E11000 duplicate key')) {
           console.log('Already exists:', p.name);
           addedCount++;
        } else {
           console.error('Failed to add', p.name, error);
        }
      }
    }
    console.log('Finished processing products. Total successful/existing:', addedCount);
  } catch (e) {
    console.error(e);
  }
}

addProducts();
