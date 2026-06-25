"use client";

import {
  DndContext,
  DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import Image from "next/image";
import { useEffect, useState } from "react";
import { getPrimaryImageUrl, parseImageUrls } from "@/lib/product-images";

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  sizes: string;
  colors: string;
  colorImages: string;
  imageUrls: string;
  featured: boolean;
  inStock: boolean;
  sortOrder?: number;
}

interface ListingsOrderProps {
  products: Product[];
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onReorder: (products: Product[]) => void;
}

function SortableListingRow({
  product,
  position,
  onEdit,
  onDelete,
}: {
  product: Product;
  position: number;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: product.id,
  });
  const imageCount = parseImageUrls(product.imageUrls).length;

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex flex-col gap-4 border bg-black/40 p-4 sm:flex-row sm:items-center ${
        isDragging
          ? "z-10 border-[var(--color-de-primary)]/60 shadow-[0_0_24px_rgba(var(--color-de-primary-rgb),0.2)]"
          : "border-white/10"
      }`}
    >
      <button
        type="button"
        className="flex shrink-0 touch-none items-center gap-3 self-start text-left sm:self-auto"
        aria-label={`Drag to reorder ${product.name}`}
        {...attributes}
        {...listeners}
      >
        <span className="flex h-10 w-10 shrink-0 items-center justify-center border border-white/15 bg-white/5 text-xs tracking-widest text-white/50">
          {position}
        </span>
        <span className="flex h-10 w-8 shrink-0 flex-col items-center justify-center gap-1 text-white/30">
          <span className="block h-0.5 w-4 rounded-full bg-current" />
          <span className="block h-0.5 w-4 rounded-full bg-current" />
          <span className="block h-0.5 w-4 rounded-full bg-current" />
        </span>
      </button>

      <div className="relative h-16 w-16 shrink-0 overflow-hidden border border-white/10">
        <Image
          src={getPrimaryImageUrl(product.imageUrls)}
          alt={product.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-white">{product.name}</p>
        <p className="text-sm text-white/50">
          ${product.price.toFixed(2)} &middot; {product.category}
          <span className="ml-2 text-white/40">
            {imageCount} image{imageCount !== 1 ? "s" : ""}
          </span>
          {product.featured && <span className="ml-2 text-[var(--color-de-primary)]">Featured</span>}
          {!product.inStock && <span className="ml-2 text-red-400">Sold Out</span>}
        </p>
      </div>

      <div className="flex shrink-0 gap-2 self-start sm:self-auto">
        <button
          type="button"
          onClick={() => onEdit(product)}
          className="border border-white/20 px-3 py-1 text-xs tracking-widest text-white/60 hover:text-white"
        >
          EDIT
        </button>
        <button
          type="button"
          onClick={() => onDelete(product.id)}
          className="border border-red-400/30 px-3 py-1 text-xs tracking-widest text-red-400/70 hover:text-red-400"
        >
          DELETE
        </button>
      </div>
    </div>
  );
}

export default function ListingsOrder({
  products,
  onEdit,
  onDelete,
  onReorder,
}: ListingsOrderProps) {
  const [items, setItems] = useState(products);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setItems(products);
  }, [products]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const persistOrder = async (orderedItems: Product[]) => {
    setSaving(true);
    setError("");

    try {
      const res = await fetch("/api/admin/products/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: orderedItems.map((item) => item.id) }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to save listing order");
      }

      onReorder(orderedItems);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save listing order");
      setItems(products);
    } finally {
      setSaving(false);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((item) => item.id === active.id);
    const newIndex = items.findIndex((item) => item.id === over.id);
    const next = arrayMove(items, oldIndex, newIndex);

    setItems(next);
    void persistOrder(next);
  };

  if (items.length === 0) {
    return (
      <p className="py-12 text-center text-sm text-white/40">
        No listings yet. Create your first product above.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs tracking-widest text-white/40">
          Drag listings to set shop priority. Top appears first.
        </p>
        {saving && <p className="text-xs tracking-widest text-[var(--color-de-primary)]">Saving order...</p>}
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((item) => item.id)} strategy={verticalListSortingStrategy}>
          <div className="space-y-3">
            {items.map((product, index) => (
              <SortableListingRow
                key={product.id}
                product={product}
                position={index + 1}
                onEdit={onEdit}
                onDelete={onDelete}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
