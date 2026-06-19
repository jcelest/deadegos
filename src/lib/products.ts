import { NextRequest } from "next/server";
import { MAX_PRODUCT_IMAGES } from "@/lib/product-images";

export async function parseProductFormData(request: NextRequest) {
  const formData = await request.formData();

  const name = String(formData.get("name") || "").trim();
  const description = String(formData.get("description") || "").trim();
  const price = parseFloat(String(formData.get("price") || "0"));
  const category = String(formData.get("category") || "apparel").trim();
  const sizes = String(formData.get("sizes") || "S,M,L,XL").trim();
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

  const newImages = formData
    .getAll("images")
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  return {
    name,
    description,
    price,
    category,
    sizes,
    featured,
    inStock,
    existingImageUrls,
    newImages,
  };
}

export function validateProductInput(data: {
  name: string;
  description: string;
  price: number;
  existingImageUrls: string[];
  newImages: File[];
  requireImages?: boolean;
}) {
  const errors: string[] = [];
  const totalImages = data.existingImageUrls.length + data.newImages.length;

  if (!data.name) errors.push("Name is required");
  if (!data.description) errors.push("Description is required");
  if (isNaN(data.price) || data.price <= 0) errors.push("Valid price is required");

  if (data.requireImages && totalImages === 0) {
    errors.push("At least one product image is required");
  }

  if (totalImages > MAX_PRODUCT_IMAGES) {
    errors.push(`Maximum ${MAX_PRODUCT_IMAGES} images allowed per listing`);
  }

  return errors;
}
