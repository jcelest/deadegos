export interface ShippingRate {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
}

/** Orders at or above this subtotal always ship free (any method). */
export const FREE_SHIPPING_THRESHOLD = 100;

/**
 * Checkout shipping methods and prices.
 * Edit `price` below to change rates. Remove the `free` entry when the promo ends.
 */
export const SHIPPING_RATES: ShippingRate[] = [
  {
    id: "free",
    name: "Free Shipping",
    description: "Limited-time promotional rate",
    price: 0,
    estimatedDays: "5–7 business days",
  },
  {
    id: "standard",
    name: "Standard",
    description: "USPS Ground Advantage",
    price: 8,
    estimatedDays: "5–7 business days",
  },
  {
    id: "express",
    name: "Express",
    description: "USPS Priority Mail",
    price: 15,
    estimatedDays: "2–3 business days",
  },
];

export function getShippingRate(id: string): ShippingRate | undefined {
  return SHIPPING_RATES.find((rate) => rate.id === id);
}

export function calculateShippingCost(
  subtotal: number,
  shippingMethodId: string
): number {
  if (subtotal >= FREE_SHIPPING_THRESHOLD) return 0;

  const rate = getShippingRate(shippingMethodId);
  return rate?.price ?? SHIPPING_RATES[0].price;
}

export function formatShippingPrice(rate: ShippingRate, subtotal: number): string {
  if (subtotal >= FREE_SHIPPING_THRESHOLD || rate.price === 0) return "FREE";
  return `$${rate.price.toFixed(2)}`;
}
