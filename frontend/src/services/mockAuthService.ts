import { User, Role } from '@/types';
import { storage } from './storage';

export const mockAuthService = {
  login: async (email: string, _password: string, role: Role): Promise<User> => {
    // Mimic realistic async API latency
    await new Promise(resolve => setTimeout(resolve, 150));

    const users = storage.getUsers();
    const cleanEmail = email.toLowerCase().trim();

    // STRICT MATCH: Normalize both email and role.
    const user = users.find(u => {
      if (u.role !== role) return false;
      const uEmail = u.email.toLowerCase().trim();
      return uEmail === cleanEmail;
    });

    if (user) {
      if (user.status === 'Suspended') {
        throw new Error('This account has been suspended.');
      }
      storage.setSession(user);
      return user;
    }

    // Check if the email is registered under a different role to provide clear guidance
    const userUnderOtherRole = users.find(u => u.email.toLowerCase().trim() === cleanEmail);
    if (userUnderOtherRole) {
      throw new Error(`This account is registered as a ${userUnderOtherRole.role}. Please sign in through the ${userUnderOtherRole.role} portal.`);
    }

    throw new Error(`No ${role} account found matching "${email}". Please verify your email or sign up.`);
  },

  register: async (userData: User): Promise<User> => {
    await new Promise(resolve => setTimeout(resolve, 150));

    const users = storage.getUsers();
    const cleanEmail = userData.email.toLowerCase().trim();

    if (users.some(u => u.email.toLowerCase().trim() === cleanEmail)) {
      throw new Error('An account with this email already exists. Please sign in.');
    }

    const normalizedUser: User = {
      ...userData,
      email: cleanEmail
    };

    users.push(normalizedUser);
    storage.setUsers(users);
    storage.setSession(normalizedUser);
    return normalizedUser;
  },

  getCurrentSession: (): User | null => {
    return storage.getSession();
  },

  setCurrentSession: (user: User | null) => {
    storage.setSession(user);
  },

  logout: () => {
    storage.setSession(null);
  }
};
