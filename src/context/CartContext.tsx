"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CartItem,
  createLineId,
  getCartCount,
  getCartTotal,
  getLineQuantity,
  loadCartFromStorage,
  saveCartToStorage,
} from "@/lib/cart";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  total: number;
  addItem: (item: Omit<CartItem, "lineId" | "quantity"> & { quantity?: number }) => void;
  removeItem: (lineId: string) => void;
  updateQuantity: (lineId: string, quantity: number) => void;
  getQuantity: (productId: string, size: string) => number;
  clearCart: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadCartFromStorage());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveCartToStorage(items);
  }, [items, hydrated]);

  const addItem = useCallback(
    (item: Omit<CartItem, "lineId" | "quantity"> & { quantity?: number }) => {
      const lineId = createLineId(item.productId, item.size);
      const qty = item.quantity ?? 1;

      setItems((prev) => {
        const existing = prev.find((i) => i.lineId === lineId);
        if (existing) {
          return prev.map((i) =>
            i.lineId === lineId ? { ...i, quantity: i.quantity + qty } : i
          );
        }
        return [
          ...prev,
          {
            lineId,
            productId: item.productId,
            name: item.name,
            price: item.price,
            size: item.size,
            imageUrl: item.imageUrl,
            quantity: qty,
          },
        ];
      });
    },
    []
  );

  const removeItem = useCallback((lineId: string) => {
    setItems((prev) => prev.filter((i) => i.lineId !== lineId));
  }, []);

  const updateQuantity = useCallback((lineId: string, quantity: number) => {
    if (quantity < 1) {
      setItems((prev) => prev.filter((i) => i.lineId !== lineId));
      return;
    }
    setItems((prev) =>
      prev.map((i) => (i.lineId === lineId ? { ...i, quantity } : i))
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const getQuantity = useCallback(
    (productId: string, size: string) => getLineQuantity(items, productId, size),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      itemCount: getCartCount(items),
      total: getCartTotal(items),
      addItem,
      removeItem,
      updateQuantity,
      getQuantity,
      clearCart,
    }),
    [items, addItem, removeItem, updateQuantity, getQuantity, clearCart]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within CartProvider");
  }
  return context;
}
