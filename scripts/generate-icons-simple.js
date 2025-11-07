const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const logoPath = path.join(__dirname, '../public/logo.png');
const iconsDir = path.join(__dirname, '../public/icons');
const splashDir = path.join(__dirname, '../public/splash');

// Crear directorios
[iconsDir, splashDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

async function generateIcons() {
  console.log('Generando iconos PWA...');
  
  for (const size of iconSizes) {
    try {
      await sharp(logoPath)
        .resize(size, size)
        .toFile(path.join(iconsDir, `icon-${size}x${size}.png`));
      console.log(`✓ icon-${size}x${size}.png`);
    } catch (err) {
      console.error(`✗ Error con icon-${size}x${size}.png:`, err.message);
    }
  }
  
  // Maskable icons
  for (const size of [192, 512]) {
    try {
      await sharp(logoPath)
        .resize(size, size)
        .toFile(path.join(iconsDir, `icon-${size}x${size}-maskable.png`));
      console.log(`✓ icon-${size}x${size}-maskable.png`);
    } catch (err) {
      console.error(`✗ Error con maskable ${size}:`, err.message);
    }
  }
  
  // Splash screens
  const splashes = [
    { w: 430, h: 932, name: 'iphone-14-pro-max-portrait' },
    { w: 393, h: 852, name: 'iphone-14-pro-portrait' },
    { w: 390, h: 844, name: 'iphone-13-portrait' },
    { w: 375, h: 812, name: 'iphone-x-portrait' }
  ];
  
  for (const s of splashes) {
    try {
      await sharp({
        create: {
          width: s.w,
          height: s.h,
          channels: 4,
          background: { r: 240, g: 244, b: 247, alpha: 1 }
        }
      })
      .composite([{
        input: await sharp(logoPath).resize(200, 200).toBuffer(),
        gravity: 'center'
      }])
      .png()
      .toFile(path.join(splashDir, `${s.name}.png`));
      console.log(`✓ ${s.name}.png`);
    } catch (err) {
      console.error(`✗ Error con ${s.name}:`, err.message);
    }
  }
  
  console.log('\n✅ Proceso completado!');
}

generateIcons().catch(console.error);




