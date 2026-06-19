import { put } from "@vercel/blob";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { v4 as uuidv4 } from "uuid";
import {
  type BlobAccessMode,
  getBlobAuthOptions,
  getConfiguredBlobAccess,
  isPrivateStoreAccessError,
  toMediaProxyUrl,
} from "@/lib/blob-access";

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

function resolveStoredUrl(access: BlobAccessMode, pathname: string, blobUrl: string): string {
  if (access === "private") {
    return toMediaProxyUrl(pathname);
  }
  return blobUrl;
}

async function putImage(
  filename: string,
  file: File,
  access: BlobAccessMode
): Promise<string> {
  const body = await fileToBuffer(file);
  const auth = await getBlobAuthOptions();

  if (!auth.token && !(auth.oidcToken && auth.storeId)) {
    const storeId = runtimeEnv("BLOB_STORE_ID");
    if (!storeId) {
      throw new Error(
        "Blob store is not linked. In Vercel → Storage → your Blob store → Projects, connect it to deadegos (Production + Preview), then redeploy."
      );
    }

    throw new Error(
      "Blob authentication failed. Redeploy after linking the store. If it still fails, add BLOB_READ_WRITE_TOKEN from your Blob store settings in Vercel."
    );
  }

  const blob = await put(filename, body, {
    access,
    addRandomSuffix: false,
    contentType: file.type || undefined,
    ...auth,
  });

  return resolveStoredUrl(access, blob.pathname, blob.url);
}

async function uploadToVercelBlob(filename: string, file: File): Promise<string> {
  const configuredAccess = getConfiguredBlobAccess();

  if (configuredAccess) {
    return putImage(filename, file, configuredAccess);
  }

  try {
    return await putImage(filename, file, "public");
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (isPrivateStoreAccessError(message)) {
      return putImage(filename, file, "private");
    }
    throw error;
  }
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
