// Update images for the 6 older products that weren't in the first batch
const imageMap = {
  'anvor-sovereign-tote': 'https://images.unsplash.com/photo-1591561954557-26941169b49e?w=800&h=1000&fit=crop&q=80',
  'royal-heritage-satchel': 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=800&h=1000&fit=crop&q=80',
  'elysian-chain-shoulder-bag': 'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=800&h=1000&fit=crop&q=80',
  'aurelia-evening-minaudiere': 'https://images.unsplash.com/photo-1606522754091-d86bbd100d98?w=800&h=1000&fit=crop&q=80',
  'monarch-crossbody-bag': 'https://images.unsplash.com/photo-1575032617751-6ddec2089882?w=800&h=1000&fit=crop&q=80',
  'vanguard-carryall-tote': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&h=1000&fit=crop&q=80',
  'classic-noir-handbag': 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=800&h=1000&fit=crop&q=80',
  'everyday-tan-tote': 'https://images.unsplash.com/photo-1590874103328-eac38a683ce7?w=800&h=1000&fit=crop&q=80',
  'minimal-pearl-shoulder-bag': 'https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?w=800&h=1000&fit=crop&q=80',
};

async function updateImages() {
  try {
    const res = await fetch('http://localhost:5000/api/products?limit=100', {
      headers: { 'Origin': 'http://localhost:3000' }
    });
    const data = await res.json();
    const products = data.data;

    let updated = 0;
    for (const product of products) {
      const newImageUrl = imageMap[product.slug];
      if (!newImageUrl) continue;

      const putRes = await fetch(`http://localhost:5000/api/products/${product._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Origin': 'http://localhost:3000'
        },
        body: JSON.stringify({ images: [newImageUrl] })
      });

      if (putRes.ok) {
        updated++;
        console.log(`Updated: ${product.name}`);
      } else {
        const err = await putRes.json();
        console.error(`Failed: ${product.name}`, err);
      }
    }

    console.log(`Done! Updated ${updated} remaining product images.`);
  } catch (e) {
    console.error('Error:', e);
  }
}

updateImages();
