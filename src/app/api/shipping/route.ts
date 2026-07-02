import { NextResponse } from "next/server";
import { getEnabledShippingRates, getShippingSettings } from "@/lib/shipping";

export async function GET() {
  try {
    const settings = await getShippingSettings();

    return NextResponse.json({
      freeShippingThreshold: settings.freeShippingThreshold,
      defaultMethodId: settings.defaultMethodId,
      rates: getEnabledShippingRates(settings),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load shipping settings";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
