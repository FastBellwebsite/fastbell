import { Address } from '@/types';

export const initialAddresses: Address[] = [
  { id: 'addr-1', label: 'Hostel', line: 'Hostel Block A, Room 204', landmark: 'Near Mess Ground' },
  { id: 'addr-2', label: 'Department', line: 'CSE Department Lab 3', landmark: 'Tech Block 2nd Floor' }
];

export { seedOrders as orders, seedOrders as initialOrders } from './seed/orders';

