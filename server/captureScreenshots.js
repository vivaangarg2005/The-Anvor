const puppeteer = require('puppeteer');
const fs = require('fs');

async function captureScreenshots() {
  const dir = '../brain/9f8821b9-04d0-489d-aa33-6e85889b6a7b/scratch';
  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
  }

  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  const baseUrl = 'http://localhost:3000';

  const viewports = {
    desktop: { width: 1280, height: 800 },
    mobile: { width: 375, height: 812, isMobile: true, hasTouch: true }
  };

  const pages = [
    { name: 'home', url: '/' },
    { name: 'products', url: '/products' },
    { name: 'product_detail', url: '/products/sovereign-tote' },
    { name: 'login', url: '/login' },
    { name: 'account', url: '/account' } // Might redirect to login, but we'll capture it
  ];

  for (const [device, viewport] of Object.entries(viewports)) {
    await page.setViewport(viewport);

    for (const p of pages) {
      console.log(`Capturing ${device} - ${p.name}...`);
      await page.goto(`${baseUrl}${p.url}`, { waitUntil: 'networkidle0' });
      // If mobile and home, open the navigation menu
      if (device === 'mobile' && p.name === 'home') {
        try {
          const menuBtn = await page.$('button[aria-label="Toggle menu"]');
          if (menuBtn) {
            await menuBtn.click();
            await new Promise(r => setTimeout(r, 1000)); // wait for animation
            await page.screenshot({ path: `${dir}/${device}_nav_open.png`, fullPage: true });
          }
        } catch (e) {
          console.error('Could not open mobile menu:', e);
        }
      }
      await page.screenshot({ path: `${dir}/${device}_${p.name}.png`, fullPage: true });
    }
  }

  await browser.close();
  console.log('Screenshots captured successfully.');
}

captureScreenshots().catch(console.error);
