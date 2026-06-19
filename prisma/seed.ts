import { PrismaClient } from "@prisma/client";
import { serializeImageUrls } from "../src/lib/product-images";

const prisma = new PrismaClient();

async function main() {
  await prisma.product.deleteMany();

  await prisma.product.createMany({
    data: [
      {
        name: "DE Star Hoodie",
        description:
          "Heavyweight cotton hoodie featuring the signature DeadEgos star emblem. Oversized fit with ribbed cuffs.",
        price: 89.99,
        category: "hoodies",
        sizes: "S,M,L,XL",
        imageUrls: serializeImageUrls(["/uploads/placeholder-hoodie.jpg"]),
        featured: true,
        inStock: true,
      },
      {
        name: "Have No Enemies Tee",
        description:
          "Premium cotton tee with the iconic slogan printed across the chest. Relaxed streetwear cut.",
        price: 45.0,
        category: "tees",
        sizes: "S,M,L,XL,XXL",
        imageUrls: serializeImageUrls(["/uploads/placeholder-tee.jpg"]),
        featured: true,
        inStock: true,
      },
      {
        name: "Blue Season Cap",
        description:
          "Structured 6-panel cap in seasonal blue. Embroidered star logo on front panel.",
        price: 38.0,
        category: "accessories",
        sizes: "One Size",
        imageUrls: serializeImageUrls(["/uploads/placeholder-cap.jpg"]),
        featured: false,
        inStock: true,
      },
    ],
  });

  console.log("Seed data created.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
