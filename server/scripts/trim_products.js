// Delete extra products, keeping only the 15 with unique images
const slugsToDelete = [
  'charcoal-grey-carryall',
  'taupe-suede-handbag',
  'rose-gold-chain-bag',
  'ivory-summer-tote',
  'aubergine-hobo-bag',
  'teal-envelope-shoulder-bag',
  'rustic-brown-market-tote',
  'silver-metallic-clutch',
  'midnight-blue-doctor-bag',
  'lavender-woven-tote',
  'cognac-saddle-bag',
];

async function trimProducts() {
  try {
    const res = await fetch('http://localhost:5000/api/products?limit=100', {
      headers: { 'Origin': 'http://localhost:3000' }
    });
    const data = await res.json();
    const products = data.data;

    let deleted = 0;
    for (const product of products) {
      if (slugsToDelete.includes(product.slug)) {
        const delRes = await fetch(`http://localhost:5000/api/products/${product._id}`, {
          method: 'DELETE',
          headers: { 'Origin': 'http://localhost:3000' }
        });
        if (delRes.ok) {
          deleted++;
          console.log(`🗑️  Deleted: ${product.name}`);
        } else {
          const err = await delRes.json();
          console.error(`❌ Failed: ${product.name}`, err);
        }
      }
    }

    // Verify final count
    const verifyRes = await fetch('http://localhost:5000/api/products?limit=100', {
      headers: { 'Origin': 'http://localhost:3000' }
    });
    const verifyData = await verifyRes.json();
    console.log(`\nDeleted ${deleted} products. Remaining: ${verifyData.data.length}`);
    verifyData.data.forEach((p, i) => console.log(`  ${i+1}. ${p.name} -> ${p.images?.[0]}`));
  } catch (e) {
    console.error('Error:', e);
  }
}

trimProducts();
