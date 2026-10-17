import { User } from '@/types';
import { storage } from './storage';

export const mockUserService = {
  getUsers: (): User[] => {
    return storage.getUsers();
  },

  getUserById: (id: string): User | undefined => {
    return storage.getUsers().find(u => u.id === id);
  },

  updateUserProfile: (userId: string, updates: Partial<User>) => {
    const users = storage.getUsers();
    const index = users.findIndex(u => u.id === userId);
    if (index >= 0) {
      users[index] = { ...users[index], ...updates } as User;
      storage.setUsers(users);

      const currentSession = storage.getSession();
      if (currentSession && (currentSession.id === userId || (currentSession as any).userId === userId)) {
        storage.setSession(users[index]);
      }
      return users[index];
    }
    return undefined;
  },

  toggleUserStatus: (id: string, status: 'Active' | 'Suspended'): User | undefined => {
    const users = storage.getUsers();
    const user = users.find(u => u.id === id);
    if (user) {
      user.status = status;
      storage.setUsers(users);
    }
    return user;
  }
};
