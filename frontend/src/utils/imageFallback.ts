export function getProductFallbackImage(categoryId?: string): string {
  switch (categoryId) {
    case 'cat-food':
      return '/products/cheese-grilled-sandwich.webp';
    case 'cat-stationery':
      return '/products/classmate-notebook.webp';
    case 'cat-grocery':
      return '/products/amul-milk.webp';
    case 'cat-laundry':
      return '/products/daily-wash.webp';
    case 'cat-care':
      return '/products/dettol-sanitizer.webp';
    default:
      return '/products/classmate-notebook.webp';
  }
}

export function getStoreFallbackImage(category?: string): string {
  switch (category) {
    case 'cat-food':
      return '/products/cheese-grilled-sandwich.webp';
    case 'cat-stationery':
      return '/products/classmate-notebook.webp';
    case 'cat-laundry':
      return '/products/daily-wash.webp';
    case 'cat-grocery':
      return '/products/amul-milk.webp';
    case 'cat-care':
      return '/products/dettol-sanitizer.webp';
    default:
      return '/products/cheese-grilled-sandwich.webp';
  }
}
