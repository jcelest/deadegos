import { NextRequest } from "next/server";
import {
  MAX_PRODUCT_IMAGES,
  parseColorImages,
  parseColors,
  parseImageUrls,
  serializeColorImages,
  serializeColors,
  serializeImageUrls,
} from "@/lib/product-images";

export interface AdminProductPayload {
  name: string;
  description: string;
  price: number;
  category: string;
  sizes: string;
  colors: string;
  featured: boolean;
  inStock: boolean;
  imageUrls: string[];
  colorImages: Record<string, string>;
}

export async function parseAdminProductPayload(
  request: NextRequest
): Promise<AdminProductPayload> {
  const body = await request.json();

  const imageUrls = Array.isArray(body.imageUrls)
    ? body.imageUrls.filter((url: unknown): url is string => typeof url === "string")
    : [];

  const colorImages =
    body.colorImages && typeof body.colorImages === "object" && !Array.isArray(body.colorImages)
      ? (body.colorImages as Record<string, string>)
      : {};

  return {
    name: String(body.name || "").trim(),
    description: String(body.description || "").trim(),
    price: parseFloat(String(body.price || "0")),
    category: String(body.category || "apparel").trim(),
    sizes: String(body.sizes || "S,M,L,XL").trim(),
    colors: serializeColors(parseColors(String(body.colors || ""))),
    featured: Boolean(body.featured),
    inStock: body.inStock !== false,
    imageUrls,
    colorImages,
  };
}

export function validateProductInput(data: {
  name: string;
  description: string;
  price: number;
  imageUrls: string[];
  colorImages: Record<string, string>;
  colors: string;
  requireImages?: boolean;
}) {
  const errors: string[] = [];
  const colors = parseColors(data.colors);
  const colorImages = parseColorImages(serializeColorImages(data.colorImages));
  const galleryCount = data.imageUrls.length;
  const colorImageCount = Object.keys(colorImages).length;
  const totalImages = galleryCount + colorImageCount;

  if (!data.name) errors.push("Name is required");
  if (!data.description) errors.push("Description is required");
  if (isNaN(data.price) || data.price <= 0) errors.push("Valid price is required");

  if (data.requireImages && totalImages === 0) {
    errors.push("At least one product image is required");
  }

  if (galleryCount > MAX_PRODUCT_IMAGES) {
    errors.push(`Maximum ${MAX_PRODUCT_IMAGES} gallery images allowed per listing`);
  }

  for (const color of colors) {
    if (!colorImages[color]) {
      errors.push(`Upload an image for color: ${color}`);
    }
  }

  return errors;
}

export function normalizeAdminProductData(data: AdminProductPayload) {
  return {
    name: data.name,
    description: data.description,
    price: data.price,
    category: data.category,
    sizes: data.sizes,
    colors: data.colors,
    colorImages: serializeColorImages(data.colorImages),
    imageUrls: serializeImageUrls(data.imageUrls),
    featured: data.featured,
    inStock: data.inStock,
  };
}

/** @deprecated Use parseAdminProductPayload for JSON admin saves. */
export async function parseProductFormData(request: NextRequest) {
  const formData = await request.formData();

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = parseFloat(String(formData.get("price") || "0"));
  const category = String(formData.get("category") || "apparel").trim();
  const sizes = String(formData.get("sizes") || "S,M,L,XL").trim();
  const colors = serializeColors(parseColors(String(formData.get("colors") || "")));
  const featured = formData.get("featured") === "true" || formData.get("featured") === "on";
  const inStock = formData.get("inStock") !== "false" && formData.get("inStock") !== "off";

  const existingImageUrlsRaw = String(formData.get("existingImageUrls") || "[]");
  let existingImageUrls: string[] = [];

  try {
    const parsed = JSON.parse(existingImageUrlsRaw);
    if (Array.isArray(parsed)) {
      existingImageUrls = parsed.filter((url): url is string => typeof url === "string");
    }
  } catch {
    existingImageUrls = [];
  }

  const colorImagesRaw = String(formData.get("colorImages") || "{}");
  let colorImages: Record<string, string> = {};
  try {
    const parsed = JSON.parse(colorImagesRaw);
    if (parsed && typeof parsed === "object" && !Array.isArray(parsed)) {
      colorImages = parsed as Record<string, string>;
    }
  } catch {
    colorImages = {};
  }

  const newImages = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  return {
    name,
    description,
    price,
    category,
    sizes,
    colors,
    featured,
    inStock,
    existingImageUrls,
    colorImages,
    newImages,
    imageUrls: existingImageUrls,
  };
}
