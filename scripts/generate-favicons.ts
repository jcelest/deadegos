import sharp from "sharp";
import path from "path";
import { writeFile } from "fs/promises";
import toIco from "to-ico";

const src = path.join(process.cwd(), "Logo Render.png");
const appDir = path.join(process.cwd(), "src", "app");
const publicDir = path.join(process.cwd(), "public");

const bg = { r: 0, g: 0, b: 0, alpha: 1 as const };

async function generate() {
  const icon16 = await sharp(src)
    .resize(16, 16, { fit: "contain", background: bg })
    .png()
    .toBuffer();

  const icon32 = await sharp(src)
    .resize(32, 32, { fit: "contain", background: bg })
    .png()
    .toBuffer();

  const icon180 = await sharp(src)
    .resize(180, 180, { fit: "contain", background: bg })
    .png()
    .toBuffer();

  const ico = await toIco([icon16, icon32]);

  await writeFile(path.join(appDir, "favicon.ico"), ico);
  await writeFile(path.join(publicDir, "favicon.ico"), ico);
  await writeFile(path.join(appDir, "icon.png"), icon32);
  await writeFile(path.join(appDir, "apple-icon.png"), icon180);
  await writeFile(path.join(publicDir, "favicon-16x16.png"), icon16);
  await writeFile(path.join(publicDir, "favicon-32x32.png"), icon32);
  await writeFile(path.join(publicDir, "apple-icon.png"), icon180);

  console.log("Favicons generated (including favicon.ico)");
}

generate().catch((error) => {
  console.error(error);
  process.exit(1);
});
