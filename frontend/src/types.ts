export type Role = 'student' | 'vendor' | 'delivery' | 'admin';

export type OrderStatus =
  | 'PLACED'
  | 'ACCEPTED'
  | 'PREPARING'
  | 'READY_FOR_PICKUP'
  | 'PICKED_UP'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED';

export interface UserLocation {
  latitude: number;
  longitude: number;
  address?: string;
  locality?: string;
  city?: string;
  state?: string;
  postalCode?: string;
}

export interface Campus {
  id: string;
  name: string;
  shortName: string;
  location: string;
  isActive: boolean;
}

export interface BaseProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  campusId: string;
  password?: string;
  status?: 'Active' | 'Suspended';
  addresses?: Address[];
  location?: UserLocation;
}

export interface StudentProfile extends BaseProfile {
  role: 'student';
  department?: string;
  year?: string;
  deliveryLocation?: string;
  profileImage?: string;
  favorites?: string[];
  addresses?: Address[];
}

export interface VendorProfile extends BaseProfile {
  role: 'vendor';
  storeId: string;
  businessName?: string;
  storeName?: string;
  category?: string;
  description?: string;
}

export interface DeliveryProfile extends BaseProfile {
  role: 'delivery';
  serviceArea?: string;
  vehicleType?: string;
  vehicleNumber?: string;
  availabilityStatus?: 'Available' | 'Busy' | 'Offline';
}

export interface AdminProfile extends BaseProfile {
  role: 'admin';
  permissions?: string[];
}

export type User = StudentProfile | VendorProfile | DeliveryProfile | AdminProfile;

export interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
}

export interface Store {
  id: string;
  campusId: string;
  vendorId: string;
  name: string;
  category: string;
  isOpen: boolean;
  rating: number;
  image: string;
  description: string;
  locationLabel: string;
  distanceFromCampus: number; // meters
  deliveryMinutes: number; // estimated minutes
  latitude?: number;
  longitude?: number;
  locality?: string;
  city?: string;
  serviceRadiusKm?: number;
}

export interface Product {
  id: string;
  storeId: string;
  campusId: string;
  name: string;
  category: string;
  categoryId?: string;
  price: number;
  originalPrice?: number;
  rating: number;
  image: string;
  description: string;
  isAvailable: boolean;
  available?: boolean;
}

export interface CartItem {
  productId: string;
  storeId: string;
  quantity: number;
}

export interface PopulatedCartItem {
  item: CartItem;
  product?: Product;
  isAvailable: boolean;
}

export interface Address {
  id?: string;
  label: string;
  line: string;
  locality?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * OrderItem preserves an immutable snapshot of the product state at the time of purchase.
 */
export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Order {
  id: string;
  campusId: string;
  studentId: string;
  storeId: string;
  deliveryPartnerId: string | null;

  date: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  discount: number;
  total: number;

  status: OrderStatus;
  address: Address;
  payment: string;

  rating?: number;
  feedback?: string;
}

export interface PersistedData {
  version: number;
  users: User[];
  stores: Store[];
  products: Product[];
  orders: Order[];
  categories: Category[];
}
