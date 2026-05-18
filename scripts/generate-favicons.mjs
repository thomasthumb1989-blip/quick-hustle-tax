/**
 * Generate favicon PNGs + ICO + resize OG image from SVG source.
 *
 * Usage:
 *   npm install -D sharp
 *   node scripts/generate-favicons.mjs
 */
import sharp from 'sharp';
import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pub = (...p) => resolve(__dirname, '..', 'public', ...p);

const svgPath = pub('favicon.svg');
const svgBuffer = readFileSync(svgPath);

// ── Favicon PNGs from SVG ──────────────────────────────────────────
const sizes = [
  { name: 'favicon-16x16.png', size: 16 },
  { name: 'favicon-32x32.png', size: 32 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'android-chrome-192x192.png', size: 192 },
  { name: 'android-chrome-512x512.png', size: 512 },
];

for (const { name, size } of sizes) {
  await sharp(svgBuffer, { density: Math.max(300, size * 2) })
    .resize(size, size)
    .png()
    .toFile(pub(name));
  console.log(`  ✓ ${name}`);
}

// ── favicon.ico (multi-size: 16, 32, 48) ───────────────────────────
// ICO format: simple uncompressed header + embedded PNGs
const icoSizes = [16, 32, 48];
const pngBuffers = [];

for (const size of icoSizes) {
  const buf = await sharp(svgBuffer, { density: size * 4 })
    .resize(size, size)
    .png()
    .toBuffer();
  pngBuffers.push({ size, buf });
}

function buildIco(entries) {
  // ICO header: 6 bytes
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);          // reserved
  header.writeUInt16LE(1, 2);          // type: ICO
  header.writeUInt16LE(entries.length, 4); // count

  // Each directory entry: 16 bytes
  const dirSize = entries.length * 16;
  let dataOffset = 6 + dirSize;

  const dirEntries = [];
  const dataChunks = [];

  for (const { size, buf } of entries) {
    const dir = Buffer.alloc(16);
    dir.writeUInt8(size >= 256 ? 0 : size, 0);   // width
    dir.writeUInt8(size >= 256 ? 0 : size, 1);   // height
    dir.writeUInt8(0, 2);                          // palette
    dir.writeUInt8(0, 3);                          // reserved
    dir.writeUInt16LE(1, 4);                       // color planes
    dir.writeUInt16LE(32, 6);                      // bits per pixel
    dir.writeUInt32LE(buf.length, 8);              // data size
    dir.writeUInt32LE(dataOffset, 12);             // data offset
    dirEntries.push(dir);
    dataChunks.push(buf);
    dataOffset += buf.length;
  }

  return Buffer.concat([header, ...dirEntries, ...dataChunks]);
}

const icoBuffer = buildIco(pngBuffers);
writeFileSync(pub('favicon.ico'), icoBuffer);
console.log('  ✓ favicon.ico (16+32+48)');

// ── Resize OG image to 1200×630 ────────────────────────────────────
const ogSource = resolve(__dirname, '..', '..', '..', 'OneDrive', 'Desktop', 'og-default.png');
try {
  const ogMeta = await sharp(ogSource).metadata();
  console.log(`  OG source: ${ogMeta.width}x${ogMeta.height}`);

  await sharp(ogSource)
    .resize(1200, 630, { fit: 'cover', position: 'centre' })
    .png({ quality: 90 })
    .toFile(pub('og-default.png'));
  console.log('  ✓ og-default.png (1200×630)');
} catch (e) {
  console.error(`  ✗ OG resize failed: ${e.message}`);
  console.error(`    Expected source at: ${ogSource}`);
  console.error('    Copy manually to public/og-default.png if path differs.');
}

console.log('\nDone! All assets in public/');
