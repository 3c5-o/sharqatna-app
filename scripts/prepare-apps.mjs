import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const variants = [
  { name: 'user', badge: null },
  { name: 'admin', badge: 'إدارة' }
];

for (const variant of variants) {
  const base = path.join(root, 'apps', variant.name);
  const source = path.join(base, 'www', 'assets', 'icons', 'icon-512.png');
  const res = path.join(base, 'android', 'app', 'src', 'main', 'res');
  if (!fs.existsSync(source) || !fs.existsSync(res)) continue;

  const densities = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
  for (const [density, size] of Object.entries(densities)) {
    const dir = path.join(res, `mipmap-${density}`);
    fs.mkdirSync(dir, { recursive: true });
    let image = sharp(source).resize(size, size, { fit: 'cover' });
    if (variant.badge) {
      const badge = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size * .75}" cy="${size * .75}" r="${size * .21}" fill="#F59E0B" stroke="#fff" stroke-width="${Math.max(2,size*.035)}"/><path d="M${size*.66} ${size*.75}h${size*.18}M${size*.75} ${size*.66}v${size*.18}" stroke="#172554" stroke-width="${size*.06}" stroke-linecap="round"/></svg>`);
      image = image.composite([{ input: badge }]);
    }
    const buf = await image.png().toBuffer();
    for (const file of ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png']) {
      fs.writeFileSync(path.join(dir, file), buf);
    }
  }
}

console.log('Android icons prepared for user and admin variants.');
