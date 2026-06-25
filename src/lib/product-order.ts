import { prisma } from "@/lib/prisma";

export const productListOrderBy = [{ sortOrder: "asc" as const }, { createdAt: "desc" as const }];

export async function getNextProductSortOrder(): Promise<number> {
  const result = await prisma.product.aggregate({ _max: { sortOrder: true } });
  return (result._max.sortOrder ?? -1) + 1;
}

export async function reorderProducts(orderedIds: string[]): Promise<void> {
  await prisma.$transaction(
    orderedIds.map((id, index) =>
      prisma.product.update({
        where: { id },
        data: { sortOrder: index },
      })
    )
  );
}
