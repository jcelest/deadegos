import { prisma } from "@/lib/prisma";
import {
  getImageForColor,
  getPrimaryImageUrl,
  parseColorImages,
  parseColors,
} from "@/lib/product-images";
import { calculateShippingCost, getShippingSettings } from "@/lib/shipping";

export interface CheckoutLineInput {
  productId: string;
  size: string;
  color?: string;
  quantity: number;
  imageUrl?: string;
}

export interface CheckoutCustomerInput {
  customerName: string;
  email: string;
  phone?: string;
  smsOptIn: boolean;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  shippingMethod: string;
}

export interface ValidatedCheckoutLine {
  productId: string;
  name: string;
  size: string;
  color: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface ValidatedCheckout {
  lines: ValidatedCheckoutLine[];
  subtotal: number;
  shippingCost: number;
  total: number;
}

export async function validateCheckoutItems(
  items: CheckoutLineInput[],
  shippingMethod: string
): Promise<{ ok: true; data: ValidatedCheckout } | { ok: false; error: string }> {
  if (!items.length) {
    return { ok: false, error: "Your cart is empty" };
  }

  const lines: ValidatedCheckoutLine[] = [];

  for (const item of items) {
    if (!item.productId || !item.size || item.quantity < 1) {
      return { ok: false, error: "Invalid cart item" };
    }

    const product = await prisma.product.findUnique({
      where: { id: item.productId },
    });

    if (!product) {
      return { ok: false, error: `Product not found: ${item.productId}` };
    }

    if (!product.inStock) {
      return { ok: false, error: `${product.name} is sold out` };
    }

    const availableSizes = product.sizes.split(",").map((s) => s.trim());
    if (!availableSizes.includes(item.size)) {
      return { ok: false, error: `Size ${item.size} is not available for ${product.name}` };
    }

    const availableColors = parseColors(product.colors);
    const color = (item.color || "").trim();

    if (availableColors.length > 0) {
      if (!color || !availableColors.includes(color)) {
        return { ok: false, error: `Color ${color || "(none)"} is not available for ${product.name}` };
      }
    }

    const colorImages = parseColorImages(product.colorImages);
    const imageUrl =
      item.imageUrl ||
      getImageForColor(colorImages, color) ||
      getPrimaryImageUrl(product.imageUrls, product.colorImages);

    lines.push({
      productId: product.id,
      name: product.name,
      size: item.size,
      color,
      price: product.price,
      quantity: item.quantity,
      imageUrl,
    });
  }

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
  const shippingSettings = await getShippingSettings();
  const shippingCost = calculateShippingCost(subtotal, shippingMethod, shippingSettings);
  const total = subtotal + shippingCost;

  return {
    ok: true,
    data: { lines, subtotal, shippingCost, total },
  };
}
