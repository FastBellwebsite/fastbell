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
      return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80';
    case 'cat-stationery':
      return 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=800&q=80';
    case 'cat-laundry':
      return 'https://images.unsplash.com/photo-1545173168-9f1947eebb7f?w=800&q=80';
    default:
      return 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&q=80';
  }
}
