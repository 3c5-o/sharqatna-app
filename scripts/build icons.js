const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

const SOURCE_URL = 'https://j.top4top.io/p_3868kjtjj1.jpg';
const SOURCE_LOCAL = path.join(__dirname, '..', 'icon-source.jpg');
const RES_DIR = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res');

const ICON_SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

const ROUND_SIZES = {
  'mipmap-mdpi': 48,
  'mipmap-hdpi': 72,
  'mipmap-xhdpi': 96,
  'mipmap-xxhdpi': 144,
  'mipmap-xxxhdpi': 192
};

const SPLASH_SIZES = {
  'drawable-land-mdpi': { w: 480, h: 320 },
  'drawable-land-hdpi': { w: 800, h: 480 },
  'drawable-land-xhdpi': { w: 1280, h: 720 },
  'drawable-land-xxhdpi': { w: 1920, h: 1080 },
  'drawable-port-mdpi': { w: 320, h: 480 },
  'drawable-port-hdpi': { w: 480, h: 800 },
  'drawable-port-xhdpi': { w: 720, h: 1280 },
  'drawable-port-xxhdpi': { w: 1080, h: 1920 }
};

async function download(url, dest) {
  const res = await fetch(url);
  const buffer = Buffer.from(await res.arrayBuffer());
  fs.writeFileSync(dest, buffer);
  console.log('✅ تم تنزيل الصورة المصدر');
}

async function generateIcons() {
  if (!fs.existsSync(SOURCE_LOCAL)) await download(SOURCE_URL, SOURCE_LOCAL);
  if (!fs.existsSync(RES_DIR)) {
    console.log('⚠️ مجلد android غير موجود، شغل أولاً: npx cap add android');
    return;
  }

  // أيقونات مربعة
  for (const [folder, size] of Object.entries(ICON_SIZES)) {
    const dir = path.join(RES_DIR, folder);
    fs.mkdirSync(dir, { recursive: true });
    await sharp(SOURCE_LOCAL)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(path.join(dir, 'ic_launcher.png'));
    await sharp(SOURCE_LOCAL)
      .resize(size, size, { fit: 'cover' })
      .png()
      .toFile(path.join(dir, 'ic_launcher_foreground.png'));
  }

  // أيقونات دائرية
  for (const [folder, size] of Object.entries(ROUND_SIZES)) {
    const dir = path.join(RES_DIR, folder);
    const svg = `<svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="white"/></svg>`;
    const icon = await sharp(SOURCE_LOCAL).resize(size, size, { fit: 'cover' }).toBuffer();
    await sharp(icon)
      .composite([{ input: Buffer.from(svg), blend: 'dest-in' }])
      .png()
      .toFile(path.join(dir, 'ic_launcher_round.png'));
  }

  // خلفيات شاشة البداية
  for (const [folder, { w, h }] of Object.entries(SPLASH_SIZES)) {
    const dir = path.join(RES_DIR, folder);
    fs.mkdirSync(dir, { recursive: true });
    await sharp({
      create: { width: w, height: h, channels: 3, background: { r: 23, g: 37, b: 84 } }
    })
    .composite([{
      input: await sharp(SOURCE_LOCAL).resize(Math.min(w, h) * 0.4, Math.min(w, h) * 0.4, { fit: 'contain' }).toBuffer(),
      gravity: 'center'
    }])
    .jpeg({ quality: 90 })
    .toFile(path.join(dir, 'splash.jpg'));
  }

  console.log('✅ تم توليد جميع الأيقونات والخلفيات بنجاح');
}

generateIcons().catch(err => {
  console.error('❌ خطأ:', err);
  process.exit(1);
});
