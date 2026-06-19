import sharp from "sharp";
import path from "path";
import { readdir } from "fs/promises";

const LOGOS_DIR = path.join(process.cwd(), "public", "logos");
const THRESHOLD = 30;

async function removeBlackBackground(file: string) {
  const input = path.join(LOGOS_DIR, file);
  const output = path.join(LOGOS_DIR, file.replace(".png", "-transparent.png"));
  const final = path.join(LOGOS_DIR, file);

  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8ClampedArray(data);

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];

    if (r <= THRESHOLD && g <= THRESHOLD && b <= THRESHOLD) {
      pixels[i + 3] = 0;
    }
  }

  await sharp(Buffer.from(pixels), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(output);

  const { rename, unlink } = await import("fs/promises");
  await unlink(final).catch(() => {});
  await rename(output, final);

  console.log(`Processed ${file} (${info.width}x${info.height})`);
}

async function main() {
  const files = await readdir(LOGOS_DIR);
  const pngs = files.filter((f) => f.endsWith(".png") && !f.startsWith("_temp_"));

  for (const file of pngs) {
    await removeBlackBackground(file);
  }

  console.log("Logo transparency processing complete.");
}

main().catch(console.error);
