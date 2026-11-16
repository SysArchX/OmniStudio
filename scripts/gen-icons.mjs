import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

/** Desenha um "O" geométrico obsidiana com anel claro, em RGBA puro. */
function drawIcon(size) {
  const pixels = Buffer.alloc(size * size * 4);
  const center = size / 2;
  const outer = size * 0.34;
  const inner = size * 0.19;
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const dx = x - center;
      const dy = y - center;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const index = (y * size + x) * 4;
      // fundo #09090B
      let r = 9;
      let g = 9;
      let b = 11;
      let a = 255;
      // anel do "O"
      if (distance <= outer && distance >= inner) {
        const t = Math.min(1, Math.max(0, (distance - inner) / (outer - inner)));
        r = Math.round(250 - t * 120);
        g = Math.round(250 - t * 120);
        b = Math.round(250 - t * 110);
      } else if (distance < inner) {
        // miolo mais escuro que o fundo, para o "O" respirar
        r = 6;
        g = 6;
        b = 8;
      }
      // cantos arredondados
      const radius = size * 0.22;
      const cx = Math.min(x, size - 1 - x);
      const cy = Math.min(y, size - 1 - y);
      if (cx < radius && cy < radius) {
        const d = Math.hypot(radius - cx, radius - cy);
        if (d > radius) a = 0;
      }
      pixels[index] = r;
      pixels[index + 1] = g;
      pixels[index + 2] = b;
      pixels[index + 3] = a;
    }
  }
  return pixels;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xedb88320 : crc >>> 1;
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuffer = Buffer.from(type, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function png(size) {
  const pixels = drawIcon(size);
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y += 1) {
    raw[y * (size * 4 + 1)] = 0;
    pixels.copy(raw, y * (size * 4 + 1) + 1, y * size * 4, (y + 1) * size * 4);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(size, 0);
  header.writeUInt32BE(size, 4);
  header[8] = 8;
  header[9] = 6;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", header),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** ICO com PNG embutido (formato aceito pelo Windows e pelo electron-builder). */
function ico(pngBuffer, size) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(1, 4);
  const entry = Buffer.alloc(16);
  entry[0] = size >= 256 ? 0 : size;
  entry[1] = size >= 256 ? 0 : size;
  entry[2] = 0;
  entry[3] = 0;
  entry.writeUInt16LE(1, 4);
  entry.writeUInt16LE(32, 6);
  entry.writeUInt32LE(pngBuffer.length, 8);
  entry.writeUInt32LE(22, 12);
  return Buffer.concat([header, entry, pngBuffer]);
}

mkdirSync("public", { recursive: true });
mkdirSync("build", { recursive: true });

const p192 = png(192);
const p512 = png(512);
const p256 = png(256);
writeFileSync("public/icon-192.png", p192);
writeFileSync("public/icon-512.png", p512);
writeFileSync("build/icon.png", p512);
writeFileSync("build/icon.ico", ico(p256, 256));
console.log(`icons ok: 192=${p192.length}B 512=${p512.length}B ico=${p256.length}B`);
