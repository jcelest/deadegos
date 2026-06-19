import { put } from "@vercel/blob";
import { getVercelOidcToken } from "@vercel/oidc";
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

function runtimeEnv(name: string): string | undefined {
  const value = process.env[name];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

function shouldUseVercelBlob(): boolean {
  return (
    process.env.VERCEL === "1" ||
    Boolean(runtimeEnv("BLOB_READ_WRITE_TOKEN")) ||
    Boolean(runtimeEnv("BLOB_STORE_ID"))
  );
}

async function fileToBuffer(file: File): Promise<Buffer> {
  const bytes = await file.arrayBuffer();
  return Buffer.from(bytes);
}

async function resolveOidcToken(): Promise<string | undefined> {
  try {
    return await getVercelOidcToken();
  } catch {
    return runtimeEnv("VERCEL_OIDC_TOKEN");
  }
}

async function uploadToVercelBlob(filename: string, file: File): Promise<string> {
  const body = await fileToBuffer(file);
  const storeId = runtimeEnv("BLOB_STORE_ID");
  const readWriteToken = runtimeEnv("BLOB_READ_WRITE_TOKEN");

  const options = {
    access: "public" as const,
    addRandomSuffix: false,
    contentType: file.type || undefined,
  };

  if (readWriteToken) {
    const blob = await put(filename, body, {
      ...options,
      token: readWriteToken,
    });
    return blob.url;
  }

  const oidcToken = await resolveOidcToken();

  if (oidcToken && storeId) {
    const blob = await put(filename, body, {
      ...options,
      oidcToken,
      storeId,
    });
    return blob.url;
  }

  if (!storeId) {
    throw new Error(
      "Blob store is not linked. In Vercel → Storage → your Blob store → Projects, connect it to deadegos (Production + Preview), then redeploy."
    );
  }

  throw new Error(
    "Blob authentication failed. Redeploy after linking the store. If it still fails, add BLOB_READ_WRITE_TOKEN from your Blob store settings in Vercel."
  );
}

export async function saveUploadedImage(file: File): Promise<string> {
  validateImage(file);

  const ext = getExtension(file);
  const filename = `products/${uuidv4()}.${ext}`;

  if (shouldUseVercelBlob()) {
    try {
      return await uploadToVercelBlob(filename, file);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Image upload failed on Vercel Blob.";
      throw new Error(message.replace(/^Vercel Blob:\s*/i, ""));
    }
  }

  await mkdir(UPLOAD_DIR, { recursive: true });

  const localName = `${uuidv4()}.${ext}`;
  const filepath = path.join(UPLOAD_DIR, localName);
  const bytes = await file.arrayBuffer();
  await writeFile(filepath, Buffer.from(bytes));

  return `/uploads/${localName}`;
}
