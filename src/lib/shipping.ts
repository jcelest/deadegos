import { prisma } from "@/lib/prisma";

export interface ShippingRate {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
  enabled: boolean;
}

export interface ShippingSettings {
  freeShippingThreshold: number;
  defaultMethodId: string;
  rates: ShippingRate[];
}

export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
  freeShippingThreshold: 100,
  defaultMethodId: "free",
  rates: [
    {
      id: "free",
      name: "Free Shipping",
      description: "Limited-time promotional rate",
      price: 0,
      estimatedDays: "5–7 business days",
      enabled: true,
    },
    {
      id: "standard",
      name: "Standard",
      description: "USPS Ground Advantage",
      price: 8,
      estimatedDays: "5–7 business days",
      enabled: true,
    },
    {
      id: "express",
      name: "Express",
      description: "USPS Priority Mail",
      price: 15,
      estimatedDays: "2–3 business days",
      enabled: true,
    },
  ],
};

function normalizeRate(raw: Partial<ShippingRate>, index: number): ShippingRate | null {
  const id = String(raw.id || "").trim();
  const name = String(raw.name || "").trim();
  if (!id || !name) return null;

  const price = Number(raw.price);
  return {
    id,
    name,
    description: String(raw.description || "").trim(),
    price: Number.isFinite(price) && price >= 0 ? price : 0,
    estimatedDays: String(raw.estimatedDays || "").trim() || "5–7 business days",
    enabled: raw.enabled !== false,
  };
}

export function parseShippingRates(value: string | null | undefined): ShippingRate[] {
  if (!value) return DEFAULT_SHIPPING_SETTINGS.rates;

  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return DEFAULT_SHIPPING_SETTINGS.rates;

    const rates = parsed
      .map((rate, index) => normalizeRate(rate as Partial<ShippingRate>, index))
      .filter((rate): rate is ShippingRate => Boolean(rate));

    return rates.length > 0 ? rates : DEFAULT_SHIPPING_SETTINGS.rates;
  } catch {
    return DEFAULT_SHIPPING_SETTINGS.rates;
  }
}

export function serializeShippingRates(rates: ShippingRate[]): string {
  return JSON.stringify(rates);
}

export function parseShippingSettings(row: {
  freeShippingThreshold: number;
  defaultMethodId: string;
  ratesJson: string;
}): ShippingSettings {
  const rates = parseShippingRates(row.ratesJson);
  const enabledRates = rates.filter((rate) => rate.enabled);
  const defaultMethodId = enabledRates.some((rate) => rate.id === row.defaultMethodId)
    ? row.defaultMethodId
    : enabledRates[0]?.id || rates[0]?.id || DEFAULT_SHIPPING_SETTINGS.defaultMethodId;

  return {
    freeShippingThreshold: Math.max(0, row.freeShippingThreshold),
    defaultMethodId,
    rates,
  };
}

export async function getShippingSettings(): Promise<ShippingSettings> {
  const existing = await prisma.siteSettings.findUnique({ where: { id: "default" } });

  if (existing) {
    return parseShippingSettings(existing);
  }

  const created = await prisma.siteSettings.create({
    data: {
      id: "default",
      freeShippingThreshold: DEFAULT_SHIPPING_SETTINGS.freeShippingThreshold,
      defaultMethodId: DEFAULT_SHIPPING_SETTINGS.defaultMethodId,
      ratesJson: serializeShippingRates(DEFAULT_SHIPPING_SETTINGS.rates),
    },
  });

  return parseShippingSettings(created);
}

export function getEnabledShippingRates(settings: ShippingSettings): ShippingRate[] {
  return settings.rates.filter((rate) => rate.enabled);
}

export function getShippingRate(
  id: string,
  settings: ShippingSettings
): ShippingRate | undefined {
  return settings.rates.find((rate) => rate.id === id);
}

export function getShippingRateLabel(id: string, settings: ShippingSettings): string {
  return getShippingRate(id, settings)?.name ?? id;
}

export function calculateShippingCost(
  subtotal: number,
  shippingMethodId: string,
  settings: ShippingSettings
): number {
  if (subtotal >= settings.freeShippingThreshold) return 0;

  const rate = getShippingRate(shippingMethodId, settings);
  if (!rate || !rate.enabled) {
    const fallback = getEnabledShippingRates(settings)[0];
    return fallback?.price ?? 0;
  }

  return rate.price;
}

export function formatShippingPrice(
  rate: ShippingRate,
  subtotal: number,
  settings: ShippingSettings
): string {
  if (subtotal >= settings.freeShippingThreshold || rate.price === 0) return "FREE";
  return `$${rate.price.toFixed(2)}`;
}

export function slugifyRateId(name: string, existingIds: string[]): string {
  const used = new Set(existingIds);
  let base =
    name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "") || "shipping";

  let id = base;
  let suffix = 2;

  while (used.has(id)) {
    id = `${base}-${suffix}`;
    suffix += 1;
  }

  return id;
}

export function validateShippingSettings(input: ShippingSettings): string[] {
  const errors: string[] = [];

  if (!Number.isFinite(input.freeShippingThreshold) || input.freeShippingThreshold < 0) {
    errors.push("Free shipping threshold must be zero or greater");
  }

  if (!input.rates.length) {
    errors.push("At least one shipping rate is required");
  }

  const ids = new Set<string>();
  let enabledCount = 0;

  for (const rate of input.rates) {
    if (!rate.id.trim() || !rate.name.trim()) {
      errors.push("Every shipping rate needs an ID and name");
      continue;
    }

    if (ids.has(rate.id)) {
      errors.push(`Duplicate shipping rate ID: ${rate.id}`);
    }
    ids.add(rate.id);

    if (!Number.isFinite(rate.price) || rate.price < 0) {
      errors.push(`Invalid price for ${rate.name}`);
    }

    if (rate.enabled) enabledCount += 1;
  }

  if (enabledCount === 0) {
    errors.push("At least one shipping rate must be enabled");
  }

  if (!input.defaultMethodId || !input.rates.some((rate) => rate.id === input.defaultMethodId && rate.enabled)) {
    errors.push("Default shipping method must be an enabled rate");
  }

  return errors;
}

export async function saveShippingSettings(input: ShippingSettings): Promise<ShippingSettings> {
  const errors = validateShippingSettings(input);
  if (errors.length > 0) {
    throw new Error(errors.join(", "));
  }

  const saved = await prisma.siteSettings.upsert({
    where: { id: "default" },
    create: {
      id: "default",
      freeShippingThreshold: input.freeShippingThreshold,
      defaultMethodId: input.defaultMethodId,
      ratesJson: serializeShippingRates(input.rates),
    },
    update: {
      freeShippingThreshold: input.freeShippingThreshold,
      defaultMethodId: input.defaultMethodId,
      ratesJson: serializeShippingRates(input.rates),
    },
  });

  return parseShippingSettings(saved);
}
