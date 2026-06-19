import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024;

export async function saveUploadedImage(file: File): Promise<string> {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Use JPEG, PNG, WebP, or GIF.");
  }

  if (file.size > MAX_SIZE) {
    throw new Error("File too large. Maximum size is 10MB.");
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
  const filename = `${uuidv4()}.${ext}`;
  const filepath = path.join(UPLOAD_DIR, filename);

  const bytes = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(bytes));

  return `/uploads/${filename}`;
}
