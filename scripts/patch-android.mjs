import fs from 'node:fs';
import path from 'node:path';

for (const variant of ['user', 'admin']) {
  const manifestPath = path.join('apps', variant, 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
  if (!fs.existsSync(manifestPath)) continue;
  let xml = fs.readFileSync(manifestPath, 'utf8');
  const permissions = [
    'android.permission.INTERNET',
    'android.permission.ACCESS_NETWORK_STATE',
    'android.permission.POST_NOTIFICATIONS',
    'android.permission.VIBRATE'
  ];
  for (const permission of permissions) {
    if (!xml.includes(permission)) {
      xml = xml.replace('<manifest', `<manifest`);
      xml = xml.replace(/(<manifest[^>]*>)/, `$1\n    <uses-permission android:name="${permission}" />`);
    }
  }
  fs.writeFileSync(manifestPath, xml);
}
