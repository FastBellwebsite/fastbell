import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Role } from '@/types';
import { mockAuthService } from '@/services/mockAuthService';
import { mockUserService } from '@/services/mockUserService';
import { SESSION_KEY } from '@/services/storage';
import toast from 'react-hot-toast';

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  role: Role | null;
  campusId: string | null;
  login: (email: string, pass: string, role: Role) => Promise<void>;
  register: (userData: User) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => mockAuthService.getCurrentSession());

  // Listen for session events
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent | CustomEvent) => {
      if ('detail' in e && (e as CustomEvent).detail?.key === SESSION_KEY) {
        setUser(mockAuthService.getCurrentSession());
      }
    };

    window.addEventListener('storage', handleStorageChange as EventListener);
    window.addEventListener('fastbell_state_change', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange as EventListener);
      window.removeEventListener('fastbell_state_change', handleStorageChange as EventListener);
    };
  }, []);

  const isAuthenticated = !!user;
  const role = user?.role || null;
  const campusId = user?.campusId || null;

  const login = async (email: string, pass: string, role: Role) => {
    try {
      const loggedInUser = await mockAuthService.login(email, pass, role);
      setUser(loggedInUser);
      toast.success(`Welcome back, ${loggedInUser.name}!`);
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  const register = async (userData: User) => {
    try {
      const newUser = await mockAuthService.register(userData);
      setUser(newUser);
      toast.success('Registration successful!');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) return;
    try {
      const updated = mockUserService.updateUserProfile(user.id, updates);
      if (updated) {
        setUser(updated);
        toast.success('Profile updated successfully');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
      throw error;
    }
  };

  const logout = () => {
    mockAuthService.logout();
    setUser(null);
    toast.success('Successfully logged out');
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, role, campusId, login, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
