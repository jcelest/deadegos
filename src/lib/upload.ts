import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_SIZE = 10 * 1024 * 1024;

function validateImage(file: File): void {
  if (!ALLOWED_TYPES.includes(file.type)) {
    throw new Error("Invalid file type. Use JPEG, PNG, WebP, or GIF.");
  }

  if (file.size > MAX_SIZE) {
    throw new Error("File too large. Maximum size is 10MB.");
  }
}

function getExtension(file: File): string {
  return file.name.split(".").pop()?.toLowerCase() || "jpg";
}

function isProductionRuntime(): boolean {
  return process.env.VERCEL === "1";
}

export async function saveUploadedImage(file: File): Promise<string> {
  validateImage(file);

  const ext = getExtension(file);
  const filename = `products/${uuidv4()}.${ext}`;

  if (isProductionRuntime()) {
    try {
      const blob = await put(filename, file, {
        access: "public",
        addRandomSuffix: false,
      });
      return blob.url;
    } catch {
      throw new Error(
        "Image upload failed. In Vercel, go to your project → Storage → create a Blob store, link it to deadegos, then redeploy."
      );
    }
  }

  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(filename, file, {
      access: "public",
      addRandomSuffix: false,
    });
    return blob.url;
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const localName = `${uuidv4()}.${ext}`;
  const filepath = path.join(UPLOAD_DIR, localName);
  const bytes = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(bytes));

  return `/uploads/${localName}`;
}
