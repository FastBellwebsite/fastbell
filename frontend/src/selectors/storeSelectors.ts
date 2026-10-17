import { Store } from '../types';

export const getStoresByCampus = (stores: Store[], campusId: string | null): Store[] => {
  if (!campusId) return stores;
  return stores.filter(s => s.campusId === campusId);
};

export const getOpenStores = (stores: Store[], campusId: string | null): Store[] => {
  return getStoresByCampus(stores, campusId).filter(s => s.isOpen);
};

export const getStoresByCategory = (stores: Store[], campusId: string | null, categoryId: string): Store[] => {
  return getStoresByCampus(stores, campusId).filter(s => s.category === categoryId);
};

export const getNearbyStores = (stores: Store[], campusId: string | null): Store[] => {
  // Proximity sort based on distanceFromCampus metric
  const campusStores = getStoresByCampus(stores, campusId);
  return [...campusStores].sort((a, b) => a.distanceFromCampus - b.distanceFromCampus);
};

export const getStoreById = (stores: Store[], storeId: string | undefined): Store | undefined => {
  if (!storeId) return undefined;
  return stores.find(s => s.id === storeId);
};
