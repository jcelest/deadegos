import { getVercelOidcToken } from "@vercel/oidc";
import type { PutCommandOptions } from "@vercel/blob";

export type BlobAccessMode = "public" | "private";

function runtimeEnv(name: string): string | undefined {
  const value = process.env[name];
  return typeof value === "string" && value.trim() !== "" ? value.trim() : undefined;
}

export function getConfiguredBlobAccess(): BlobAccessMode | undefined {
  const configured = runtimeEnv("BLOB_ACCESS")?.toLowerCase();
  if (configured === "public" || configured === "private") {
    return configured;
  }
  return undefined;
}

export async function resolveOidcToken(): Promise<string | undefined> {
  try {
    return await getVercelOidcToken();
  } catch {
    return runtimeEnv("VERCEL_OIDC_TOKEN");
  }
}

export async function getBlobAuthOptions(): Promise<Pick<PutCommandOptions, "token" | "oidcToken" | "storeId">> {
  const readWriteToken = runtimeEnv("BLOB_READ_WRITE_TOKEN");
  if (readWriteToken) {
    return { token: readWriteToken };
  }

  const oidcToken = await resolveOidcToken();
  const storeId = runtimeEnv("BLOB_STORE_ID");

  if (oidcToken && storeId) {
    return { oidcToken, storeId };
  }

  return {};
}

export function isPrivateStoreAccessError(message: string): boolean {
  return message.toLowerCase().includes("private store");
}

export function toMediaProxyUrl(pathname: string): string {
  return `/api/media/${pathname.split("/").map(encodeURIComponent).join("/")}`;
}

export function blobUrlToMediaProxyUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (!parsed.hostname.endsWith(".blob.vercel-storage.com")) {
      return null;
    }
    const pathname = parsed.pathname.replace(/^\/+/, "");
    return pathname ? toMediaProxyUrl(pathname) : null;
  } catch {
    return null;
  }
}
