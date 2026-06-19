export interface ShippingRate {
  id: string;
  name: string;
  description: string;
  price: number;
  estimatedDays: string;
}

export const FREE_SHIPPING_THRESHOLD = 100;

export const SHIPPING_RATES: ShippingRate[] = [
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
