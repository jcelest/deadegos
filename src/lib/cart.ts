export interface CartItem {
  lineId: string;
  productId: string;
  name: string;
  price: number;
  size: string;
  color: string;
  imageUrl: string;
  quantity: number;
}

export const CART_STORAGE_KEY = "deadegos-cart";

export function createLineId(productId: string, size: string, color = ""): string {
  return `${productId}::${size}::${color}`;
}

export function loadCartFromStorage(): CartItem[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return parsed
      .filter((item) => item && typeof item === "object")
      .map((item) => ({
        lineId: item.lineId || createLineId(item.productId, item.size, item.color || ""),
        productId: String(item.productId),
        name: String(item.name),
        price: Number(item.price),
        size: String(item.size),
        color: String(item.color || ""),
        imageUrl: String(item.imageUrl),
        quantity: Math.max(1, Number(item.quantity) || 1),
      }));
  } catch {
    return [];
  }
}

export function saveCartToStorage(items: CartItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
}

export function getCartTotal(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
}

export function getCartCount(items: CartItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity, 0);
}

export interface CartProductGroup {
  productId: string;
  name: string;
  imageUrl: string;
  price: number;
  lines: CartItem[];
}

export function groupCartByProduct(items: CartItem[]): CartProductGroup[] {
  const groups: CartProductGroup[] = [];
  const indexByProduct = new Map<string, number>();

  for (const item of items) {
    const existingIndex = indexByProduct.get(item.productId);

    if (existingIndex !== undefined) {
      groups[existingIndex].lines.push(item);
    } else {
      indexByProduct.set(item.productId, groups.length);
      groups.push({
        productId: item.productId,
        name: item.name,
        imageUrl: item.imageUrl,
        price: item.price,
        lines: [item],
      });
    }
  }

  return groups;
}

export function getLineQuantity(
  items: CartItem[],
  productId: string,
  size: string,
  color = ""
): number {
  const lineId = createLineId(productId, size, color);
  return items.find((item) => item.lineId === lineId)?.quantity ?? 0;
}
