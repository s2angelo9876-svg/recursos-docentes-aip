import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

async function processShield() {
  const inputPath = path.resolve('public/Escudo Bandera.jpeg');
  const outputPath = path.resolve('public/escudo-bandera.png');
  const faviconPath = path.resolve('public/favicon.png');

  const image = sharp(inputPath);
  const metadata = await image.metadata();
  const width = metadata.width;
  const height = metadata.height;

  // Get raw RGBA buffer
  const { data, info } = await image
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const channels = info.channels; // 4 (RGBA)

  console.log(`Image size: ${width}x${height}, channels: ${channels}`);

  // Helper to check if pixel is "white-ish" / background
  // Looking at the JPEG compression artifacts, white background is typically R>220, G>220, B>220
  // and color difference between R, G, B is small (grayscale-like).
  const isOuterBackground = (r, g, b) => {
    // Escudo border is golden / brown / yellow (e.g. R~190-210, G~150-180, B~60-120).
    // White background in JPEG typically has R, G, B all > 215 or > 220
    const minVal = Math.min(r, g, b);
    const maxVal = Math.max(r, g, b);
    const diff = maxVal - minVal;

    // Check if it's whitish / near-white background
    if (r >= 210 && g >= 210 && b >= 210 && diff < 28) {
      return true;
    }
    // Also check for slight compression tint at the edges
    if (r >= 230 && g >= 230 && b >= 230) {
      return true;
    }
    return false;
  };

  // BFS / Flood fill from outer perimeter
  const visited = new Uint8Array(width * height);
  const queue = [];

  const enqueue = (x, y) => {
    if (x < 0 || x >= width || y < 0 || y >= height) return;
    const idx = y * width + x;
    if (visited[idx]) return;

    const pIdx = idx * 4;
    const r = data[pIdx];
    const g = data[pIdx + 1];
    const b = data[pIdx + 2];

    if (isOuterBackground(r, g, b)) {
      visited[idx] = 1;
      queue.push((y << 16) | x);
    }
  };

  // Seed with all perimeter pixels
  for (let x = 0; x < width; x++) {
    enqueue(x, 0);
    enqueue(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    enqueue(0, y);
    enqueue(width - 1, y);
  }

  // Also check top dips and bottom corners specifically
  for (let x = 0; x < width; x++) {
    for (let y = 0; y < 15; y++) {
      enqueue(x, y);
    }
    for (let y = height - 15; y < height; y++) {
      enqueue(x, y);
    }
  }

  console.log(`Initial seeds in queue: ${queue.length}`);

  let head = 0;
  while (head < queue.length) {
    const val = queue[head++];
    const x = val & 0xffff;
    const y = (val >> 16) & 0xffff;

    // 4-neighborhood
    const neighbors = [
      [x + 1, y],
      [x - 1, y],
      [x, y + 1],
      [x, y - 1],
      // 8-neighborhood for smoother diagonals
      [x + 1, y + 1],
      [x - 1, y + 1],
      [x + 1, y - 1],
      [x - 1, y - 1],
    ];

    for (const [nx, ny] of neighbors) {
      if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
        const nIdx = ny * width + nx;
        if (!visited[nIdx]) {
          const pIdx = nIdx * 4;
          const r = data[pIdx];
          const g = data[pIdx + 1];
          const b = data[pIdx + 2];
          if (isOuterBackground(r, g, b)) {
            visited[nIdx] = 1;
            queue.push((ny << 16) | nx);
          }
        }
      }
    }
  }

  console.log(`Total background pixels detected: ${queue.length}`);

  // Create new RGBA buffer with alpha=0 for background
  const outputBuffer = Buffer.from(data);
  for (let idx = 0; idx < width * height; idx++) {
    if (visited[idx]) {
      const pIdx = idx * 4;
      outputBuffer[pIdx + 3] = 0; // Alpha = 0 (transparent)
    }
  }

  // Feather / soften the edge slightly so there are no jagged artifacts
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      if (!visited[idx]) {
        // If it's adjacent to a transparent pixel, check if it's a fringe pixel
        let transparentNeighbors = 0;
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
          if (visited[(y + dy) * width + (x + dx)]) {
            transparentNeighbors++;
          }
        }
        if (transparentNeighbors > 0) {
          const pIdx = idx * 4;
          const r = outputBuffer[pIdx];
          const g = outputBuffer[pIdx + 1];
          const b = outputBuffer[pIdx + 2];
          // If the pixel is very light (near border bleed), soften alpha
          const avg = (r + g + b) / 3;
          if (avg > 200) {
            outputBuffer[pIdx + 3] = Math.max(0, Math.min(255, Math.round(255 * (1 - (avg - 200) / 55))));
          }
        }
      }
    }
  }

  // Save the transparent PNG
  await sharp(outputBuffer, {
    raw: {
      width,
      height,
      channels: 4,
    },
  })
    .png({ compressionLevel: 9 })
    .toFile(outputPath);

  // Also copy to 'public/Escudo Bandera.png' for convenience
  const escudoPngPath = path.resolve('public/Escudo Bandera.png');
  fs.copyFileSync(outputPath, escudoPngPath);

  console.log(`Saved transparent shield to: ${outputPath} and ${escudoPngPath}`);

  // Also generate favicon.png (trimmed/tight transparent shield)
  await sharp(outputPath)
    .trim() // trims any empty transparent border for maximum favicon clarity
    .resize(192, 192, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toFile(faviconPath);

  console.log(`Saved favicon to: ${faviconPath}`);
}

processShield().catch(console.error);

