import type { Category, Product } from '../domain/types';

export function listActiveProducts(products: Product[], categoryId?: string): Product[] {
  return products
    .filter((product) => product.isActive && (!categoryId || product.categoryId === categoryId))
    .sort((a, b) => a.displayOrder - b.displayOrder);
}

export function getProductBySlug(products: Product[], slug: string): Product | undefined {
  return products.find((product) => product.isActive && product.slug === slug);
}

export function listActiveCategories(categories: Category[]): Category[] {
  return categories
    .filter((category) => category.isActive)
    .sort((a, b) => a.displayOrder - b.displayOrder);
}
