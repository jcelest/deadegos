import sharp from "sharp";
import path from "path";

const input = path.join(process.cwd(), "public", "logos", "logo-blue.png");
const output = path.join(process.cwd(), "public", "logos", "logo-orange.png");

const ORANGE = { r: 255, g: 102, b: 0 };
const ORANGE_DARK = { r: 180, g: 60, b: 0 };

async function main() {
  const { data, info } = await sharp(input)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const pixels = new Uint8ClampedArray(data);

  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i];
    const g = pixels[i + 1];
    const b = pixels[i + 2];
    const a = pixels[i + 3];

    if (a === 0) continue;

    const isBlue = b > r + 30 && b > 80;
    const isDarkBlue = b > 40 && r < 40 && g < 60 && b < 120;

    if (isBlue) {
      pixels[i] = ORANGE.r;
      pixels[i + 1] = ORANGE.g;
      pixels[i + 2] = ORANGE.b;
    } else if (isDarkBlue) {
      pixels[i] = ORANGE_DARK.r;
      pixels[i + 1] = ORANGE_DARK.g;
      pixels[i + 2] = ORANGE_DARK.b;
    }
  }

  await sharp(Buffer.from(pixels), {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(output);

  console.log(`Created ${output}`);
}

main().catch(console.error);
