// Update all 26 products with local image URLs
// 15 unique images, remaining 11 reuse from matching categories

const imageMap = {
  // 13 generated + 2 downloaded = 15 unique
  'anvor-sovereign-tote':       '/products/anvor-sovereign-tote.png',
  'royal-heritage-satchel':     '/products/royal-heritage-satchel.png',
  'elysian-chain-shoulder-bag': '/products/elysian-chain-shoulder-bag.png',
  'aurelia-evening-minaudiere': '/products/aurelia-evening-minaudiere.png',
  'monarch-crossbody-bag':      '/products/monarch-crossbody-bag.png',
  'vanguard-carryall-tote':     '/products/vanguard-carryall-tote.png',
  'crimson-leather-satchel':    '/products/crimson-leather-satchel.png',
  'navy-weekend-tote':          '/products/navy-weekend-tote.png',
  'blush-pink-crossbody':       '/products/blush-pink-crossbody.png',
  'olive-green-work-tote':      '/products/olive-green-work-tote.png',
  'emerald-city-handbag':       '/products/emerald-city-handbag.png',
  'mustard-yellow-slouch-bag':  '/products/mustard-yellow-slouch-bag.png',
  'monochrome-canvas-tote':     '/products/monochrome-canvas-tote.png',
  'burgundy-structured-handbag':'/products/burgundy-structured-handbag.png',
  'sky-blue-mini-shoulder-bag': '/products/sky-blue-mini-shoulder-bag.png',

  // Remaining 11 — reuse closest matching image
  'charcoal-grey-carryall':     '/products/anvor-sovereign-tote.png',       // dark tote
  'taupe-suede-handbag':        '/products/royal-heritage-satchel.png',     // tan/brown handbag
  'rose-gold-chain-bag':        '/products/elysian-chain-shoulder-bag.png', // chain shoulder bag
  'ivory-summer-tote':          '/products/monochrome-canvas-tote.png',     // light tote
  'aubergine-hobo-bag':         '/products/burgundy-structured-handbag.png',// deep color handbag
  'teal-envelope-shoulder-bag': '/products/monarch-crossbody-bag.png',      // shoulder/crossbody
  'rustic-brown-market-tote':   '/products/vanguard-carryall-tote.png',     // leather tote
  'silver-metallic-clutch':     '/products/aurelia-evening-minaudiere.png',  // evening/clutch
  'midnight-blue-doctor-bag':   '/products/crimson-leather-satchel.png',    // structured bag
  'lavender-woven-tote':        '/products/olive-green-work-tote.png',      // tote
  'cognac-saddle-bag':          '/products/mustard-yellow-slouch-bag.png',   // warm tone shoulder
};

async function updateAllImages() {
  try {
    const res = await fetch('http://localhost:5000/api/products?limit=100', {
      headers: { 'Origin': 'http://localhost:3000' }
    });
    const data = await res.json();
    const products = data.data;
    console.log(`Found ${products.length} products to update`);

    let updated = 0;
    for (const product of products) {
      const imageUrl = imageMap[product.slug];
      if (!imageUrl) {
        console.log(`⚠️  No mapping for: ${product.slug}`);
        continue;
      }

      const putRes = await fetch(`http://localhost:5000/api/products/${product._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3000'
        },
        body: JSON.stringify({ images: [imageUrl] })
      });

      if (putRes.ok) {
        updated++;
        console.log(`✅ ${product.name} -> ${imageUrl}`);
      } else {
        const err = await putRes.json();
        console.error(`❌ ${product.name}:`, err);
      }
    }

    console.log(`\nDone! Updated ${updated}/${products.length} product images.`);
  } catch (e) {
    console.error('Error:', e);
  }
}

updateAllImages();
