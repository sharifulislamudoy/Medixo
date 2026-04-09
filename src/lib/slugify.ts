import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Convert a string into a URL-friendly slug.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .normalize('NFD')                   // split accented characters
    .replace(/[\u0300-\u036f]/g, '')    // remove diacritics
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')               // spaces to hyphens
    .replace(/[^\w\-]+/g, '')           // remove non-word chars
    .replace(/\-\-+/g, '-');            // replace multiple hyphens
}

/**
 * Generate a unique slug by appending a counter if necessary.
 */
export async function generateUniqueSlug(
  baseSlug: string,
  prismaInstance: any = prisma,
  excludeId?: string
): Promise<string> {
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await prismaInstance.product.findFirst({
      where: {
        slug,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      select: { id: true },
    });

    if (!existing) break;
    slug = `${baseSlug}-${counter}`;
    counter++;
  }

  return slug;
}