import { get } from "@vercel/blob";
import { NextRequest, NextResponse } from "next/server";
import { getBlobAuthOptions } from "@/lib/blob-access";

export const runtime = "nodejs";

const CACHE_HEADERS = {
  "Cache-Control": "public, max-age=31536000, immutable",
  "CDN-Cache-Control": "public, max-age=31536000, immutable",
};

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params;
  const pathname = path.map(decodeURIComponent).join("/");

  if (!pathname || pathname.includes("..")) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }

  try {
    const auth = await getBlobAuthOptions();
    const result = await get(pathname, {
      access: "private",
      useCache: true,
      ...auth,
    });

    if (!result) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const buffer = Buffer.from(await new Response(result.stream).arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        ...CACHE_HEADERS,
        "Content-Type": result.blob.contentType || "application/octet-stream",
        "Content-Length": String(buffer.byteLength),
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load image";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
