import { Product, Order, Store, User, Category } from '../types';
import { getNearbyStores } from '../utils/location';
import { storage } from '../services/storage';

/**
 * Robust availability check checking both isAvailable and available properties.
 */
export const isProductAvailable = (p: Product): boolean => {
  return p.isAvailable !== false && p.available !== false;
};

export const getProductsByStore = (products: Product[], storeId: string): Product[] => {
  return products.filter(p => p.storeId === storeId);
};

export const getAvailableProducts = (products: Product[], storeId?: string): Product[] => {
  if (storeId) {
    return getProductsByStore(products, storeId).filter(isProductAvailable);
  }
  return products.filter(isProductAvailable);
};

export const getProductById = (products: Product[], productId: string | undefined): Product | undefined => {
  if (!productId) return undefined;
  return products.find(p => p.id === productId);
};

/**
 * Filter products belonging to given nearby / serviceable stores.
 */
export const getProductsForNearbyStores = (
  products: Product[],
  nearbyStores: Store[]
): Product[] => {
  const nearbyStoreIds = new Set(nearbyStores.map(s => s.id));
  return products.filter(p => nearbyStoreIds.has(p.storeId) && isProductAvailable(p));
};

/**
 * getAvailableProductsForUser:
 * Core canonical selector deriving all valid, non-orphaned, available products
 * within the user's campus and service radius.
 *
 * Checks:
 * 1. Store relationship (product.storeId points to an existing store)
 * 2. Serviceability (store is within user's service radius)
 * 3. Category relationship (product.categoryId/category exists in categories)
 * 4. Product availability (product.available === true && product.isAvailable === true)
 */
export const getAvailableProductsForUser = (
  products: Product[],
  storesOrUser?: Store[] | User | null,
  userOrStores?: User | Store[] | null,
  categories?: Category[],
  maxRadiusKm = 6
): Product[] => {
  let stores: Store[] = [];
  let user: User | null | undefined = null;

  if (Array.isArray(storesOrUser)) {
    stores = storesOrUser;
    user = userOrStores as User | null | undefined;
  } else {
    user = storesOrUser as User | null | undefined;
    if (Array.isArray(userOrStores)) {
      stores = userOrStores;
    } else {
      stores = storage.getStores();
    }
  }

  const campusId = user?.campusId || 'sns';
  // Campus stores
  const campusStores = stores.filter(s => !s.campusId || s.campusId === campusId);

  // Serviceable stores in user radius
  const nearbyStores = getNearbyStores(user?.location, campusStores, maxRadiusKm);
  const nearbyStoreIds = new Set(nearbyStores.map(s => s.id));
  const validStoreMap = new Map(stores.map(s => [s.id, s]));

  // Valid category IDs
  const categoryList = categories && categories.length > 0 ? categories : storage.getCategories();
  const validCategoryIds = new Set(categoryList.flatMap(c => [c.id, c.slug].filter(Boolean)));

  return products.filter(p => {
    // 1. Must belong to an existing store in the current dataset
    if (!p.storeId || !validStoreMap.has(p.storeId)) return false;

    // 2. Store must be serviceable in user's area
    if (!nearbyStoreIds.has(p.storeId)) return false;

    // 3. Category relationship validation (prevent orphaned products)
    if (validCategoryIds.size > 0) {
      const pCat = p.categoryId || p.category;
      if (!pCat || !validCategoryIds.has(pCat)) return false;
    }

    // 4. Product must be currently available
    return isProductAvailable(p);
  });
};

/**
 * getOrderAgainProducts:
 * User-specific past order purchases.
 * For new users or users with 0 orders, returns an empty array (DO NOT show Order Again).
 * For existing users with orders, derives products from their orders that are currently available.
 */
export const getOrderAgainProducts = (
  products: Product[],
  orders: Order[],
  user: User | null | undefined,
  limit = 6
): Product[] => {
  if (!user || !user.id) return [];
  const myOrders = orders.filter(o => o.studentId === user.id);
  if (myOrders.length === 0) return [];

  // Sort orders descending (most recent first)
  const sortedOrders = [...myOrders].sort(
    (a, b) => new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime()
  );

  const orderedIds: string[] = [];
  const seen = new Set<string>();

  for (const order of sortedOrders) {
    for (const item of order.items || []) {
      if (item.productId && !seen.has(item.productId)) {
        seen.add(item.productId);
        orderedIds.push(item.productId);
      }
    }
  }

  const availableMap = new Map(products.map(p => [p.id, p]));
  const result: Product[] = [];

  for (const id of orderedIds) {
    const prod = availableMap.get(id);
    if (prod && isProductAvailable(prod)) {
      result.push(prod);
      if (limit && result.length >= limit) break;
    }
  }

  return result;
};

/**
 * getCuratedDiscoveryProducts:
 * Rule-based selection for the Home discovery rail ("Available Around You").
 *
 * Curation logic:
 * 1. Prioritizes newly added / vendor-created products so new items immediately appear on Home.
 * 2. Curates diverse representation across campus categories (food, stationery, dorm, laundry, care)
 *    so Home reflects the full expanded product catalog rather than only a single category.
 * 3. Incorporates popularity / ratings within categories.
 * 4. Yields up to `limit` (default 8) products.
 */
export const getCuratedDiscoveryProducts = (
  availableProducts: Product[],
  orders: Order[] = [],
  user?: User | null,
  limit = 8
): Product[] => {
  if (availableProducts.length <= limit) {
    return availableProducts;
  }

  // Newly added products (e.g., vendor created with timestamp IDs like prod-17...)
  const isNewlyAdded = (p: Product) => {
    return /^prod-\d{10,}$/.test(p.id);
  };

  const newProducts = availableProducts.filter(isNewlyAdded);
  const establishedProducts = availableProducts.filter(p => !isNewlyAdded(p));

  // Build popularity map from orders
  const popularityMap: Record<string, number> = {};
  orders.forEach(o => {
    o.items?.forEach(item => {
      popularityMap[item.productId] = (popularityMap[item.productId] || 0) + item.quantity;
    });
  });

  // Group products by category
  const categoryGroups = new Map<string, Product[]>();
  establishedProducts.forEach(p => {
    const cat = p.categoryId || p.category || 'other';
    if (!categoryGroups.has(cat)) {
      categoryGroups.set(cat, []);
    }
    categoryGroups.get(cat)!.push(p);
  });

  // Sort products within each category by popularity and rating
  categoryGroups.forEach(prods => {
    prods.sort((a, b) => {
      const popA = popularityMap[a.id] || 0;
      const popB = popularityMap[b.id] || 0;
      if (popB !== popA) return popB - popA;
      return (b.rating || 0) - (a.rating || 0);
    });
  });

  const selected: Product[] = [];
  const selectedIds = new Set<string>();

  // A. Priority 1: New / vendor created products (at the front of Home discovery)
  for (const np of newProducts) {
    if (selected.length < limit && !selectedIds.has(np.id)) {
      selected.push(np);
      selectedIds.add(np.id);
    }
  }

  // B. Priority 2: Round-robin across distinct categories to ensure broad catalog representation
  const categories = Array.from(categoryGroups.keys());
  let depth = 0;
  let addedInPass = true;

  while (selected.length < limit && addedInPass) {
    addedInPass = false;
    for (const cat of categories) {
      const prods = categoryGroups.get(cat)!;
      if (depth < prods.length) {
        const candidate = prods[depth];
        if (!selectedIds.has(candidate.id)) {
          selected.push(candidate);
          selectedIds.add(candidate.id);
          addedInPass = true;
          if (selected.length >= limit) break;
        }
      }
    }
    depth++;
  }

  // C. Fallback: Fill any remaining slots from availableProducts
  if (selected.length < limit) {
    for (const p of availableProducts) {
      if (!selectedIds.has(p.id)) {
        selected.push(p);
        selectedIds.add(p.id);
        if (selected.length >= limit) break;
      }
    }
  }

  return selected;
};

/**
 * getPopularProducts: Products appearing most frequently across all completed/active campus orders.
 * Returns sorted available products. If limit is provided, slices to limit.
 */
export const getPopularProducts = (
  products: Product[],
  orders: Order[],
  limit?: number
): Product[] => {
  const popularityMap: Record<string, number> = {};
  orders.forEach(o => {
    o.items?.forEach(item => {
      popularityMap[item.productId] = (popularityMap[item.productId] || 0) + item.quantity;
    });
  });

  const sortedAvailable = [...products]
    .filter(isProductAvailable)
    .sort((a, b) => {
      const popA = popularityMap[a.id] || 0;
      const popB = popularityMap[b.id] || 0;
      if (popB !== popA) return popB - popA;
      return (b.rating || 0) - (a.rating || 0);
    });

  return typeof limit === 'number' ? sortedAvailable.slice(0, limit) : sortedAvailable;
};

/**
 * getUsualProducts: Rule-based retrieval of products actually purchased in past orders by the current student.
 * If student has no order history, falls back to top available products.
 */
export const getUsualProducts = (products: Product[], orders: Order[], studentId: string | null): Product[] => {
  if (!studentId) {
    return products.filter(isProductAvailable).slice(0, 4);
  }

  const userOrders = orders.filter(o => o.studentId === studentId);
  if (userOrders.length === 0) {
    return products.filter(isProductAvailable).slice(0, 4);
  }

  // Count item frequency for this user
  const productFrequency: Record<string, number> = {};
  userOrders.forEach(o => {
    o.items?.forEach(item => {
      productFrequency[item.productId] = (productFrequency[item.productId] || 0) + item.quantity;
    });
  });

  const orderedProductIds = Object.keys(productFrequency).sort(
    (a, b) => productFrequency[b] - productFrequency[a]
  );

  const matched = orderedProductIds
    .map(id => products.find(p => p.id === id))
    .filter((p): p is Product => Boolean(p && isProductAvailable(p)));

  return matched.length > 0 ? matched.slice(0, 6) : products.filter(isProductAvailable).slice(0, 4);
};

/**
 * getRecommendedProducts: Rule-based combination of student's preferred categories,
 * currently available products, and popular items.
 */
export const getRecommendedProducts = (products: Product[], orders: Order[], studentId: string | null): Product[] => {
  const available = products.filter(isProductAvailable);

  if (!studentId) {
    return getPopularProducts(products, orders, 6);
  }

  // Find categories the student has bought from
  const userOrders = orders.filter(o => o.studentId === studentId);
  const preferredCategorySet = new Set<string>();

  userOrders.forEach(order => {
    order.items?.forEach(item => {
      const prod = products.find(p => p.id === item.productId);
      if (prod) preferredCategorySet.add(prod.category);
    });
  });

  // Prioritize items in preferred categories
  const categoryMatched = available.filter(p => preferredCategorySet.has(p.category));
  const popular = getPopularProducts(products, orders, 6);

  const combined = [...categoryMatched, ...popular];
  const uniqueMap = new Map<string, Product>();
  combined.forEach(p => {
    if (!uniqueMap.has(p.id)) {
      uniqueMap.set(p.id, p);
    }
  });

  return Array.from(uniqueMap.values()).slice(0, 6);
};
