import { NextRequest, NextResponse } from "next/server";
import { isAdminAuthenticated } from "@/lib/auth";
import {
  ShippingSettings,
  getShippingSettings,
  saveShippingSettings,
  validateShippingSettings,
} from "@/lib/shipping";

export const runtime = "nodejs";

export async function GET() {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const settings = await getShippingSettings();
    return NextResponse.json(settings);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load shipping settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const authenticated = await isAdminAuthenticated();
  if (!authenticated) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<ShippingSettings>;
    const settings: ShippingSettings = {
      freeShippingThreshold: Number(body.freeShippingThreshold ?? 0),
      defaultMethodId: String(body.defaultMethodId || ""),
      rates: Array.isArray(body.rates) ? body.rates : [],
    };

    const errors = validateShippingSettings(settings);
    if (errors.length > 0) {
      return NextResponse.json({ error: errors.join(", ") }, { status: 400 });
    }

    const saved = await saveShippingSettings(settings);
    return NextResponse.json(saved);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to save shipping settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
