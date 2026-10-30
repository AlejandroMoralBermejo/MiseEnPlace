// Regenerates the app icons from the logo: node scripts/generate-icons.mjs
import { mkdirSync } from 'node:fs';
import sharp from 'sharp';

// The tiles stay inside the central 80% so Android can crop the icon to any shape.
const svg = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0f3440"/>
  <rect x="112" y="112" width="130" height="130" rx="28" fill="#62919b"/>
  <rect x="270" y="112" width="130" height="130" rx="28" fill="#62919b"/>
  <rect x="112" y="270" width="130" height="130" rx="28" fill="#62919b"/>
  <rect x="270" y="270" width="130" height="130" rx="28" fill="#f2b632"/>
</svg>`);

mkdirSync('public/icons', { recursive: true });

for (const [size, file] of [
  [192, 'public/icons/icon-192.png'],
  [512, 'public/icons/icon-512.png'],
  [180, 'src/app/apple-icon.png'],
]) {
  await sharp(svg, { density: 300 }).resize(size, size).png().toFile(file);
}
