import { Address } from './types';
import { seedCategories, seedStores, seedProducts, seedOrders, seedCampuses } from './data/seed';
import { storage } from './services/storage';

export const categories = seedCategories;
export const stores = seedStores;
export const products = seedProducts;
export const orders = seedOrders;
export const users = storage.getUsers();
export const campuses = seedCampuses;

export const addresses: Address[] = [
  { id: 'addr-1', label: 'Hostel', line: 'Hostel Block A, Room 204', landmark: 'Near Mess Ground' },
  { id: 'addr-2', label: 'Department', line: 'CSE Department Lab 3', landmark: 'Tech Block 2nd Floor' }
];
