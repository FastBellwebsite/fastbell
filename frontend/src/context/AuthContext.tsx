import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Role } from '@/types';
import { api, authToken } from '@/services/api';
import { storage } from '@/services/storage';
import { mockUserService } from '@/services/mockUserService';
import toast from 'react-hot-toast';

type AuthContextValue = {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  role: Role | null;
  campusId: string | null;
  login: (email: string, pass: string, role: Role) => Promise<void>;
  register: (userData: User) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const mapApiUserToFrontendUser = (apiUser: any): User => {
  const normalizedRole = (
    apiUser.role === 'DELIVERY_PARTNER'
      ? 'delivery'
      : String(apiUser.role || '').toLowerCase()
  ) as Role;

  const base = {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    phone: apiUser.phone || '',
    role: normalizedRole,
    campusId: apiUser.campusId || apiUser.campus?.id || 'sns',
    status: apiUser.status || (apiUser.isActive ? 'Active' : 'Suspended'),
    addresses: apiUser.addresses || [],
  };

  if (normalizedRole === 'student') {
    return {
      ...base,
      role: 'student',
      department: apiUser.department || apiUser.studentProfile?.department,
      year: apiUser.year || apiUser.studentProfile?.year,
      addresses: apiUser.addresses || [],
      location: apiUser.location,
      favorites: [],
    } as User;
  }

  if (normalizedRole === 'vendor') {
    return {
      ...base,
      role: 'vendor',
      storeId: apiUser.storeId || apiUser.vendorProfile?.stores?.[0]?.id || '',
      storeName: apiUser.storeName || apiUser.vendorProfile?.stores?.[0]?.name,
      storeIds: apiUser.storeIds || (apiUser.storeId ? [apiUser.storeId] : (apiUser.vendorProfile?.stores?.map((s: any) => s.id) || [])),
      vendorProfileId: apiUser.vendorProfileId || apiUser.vendorProfile?.id,
      businessName: apiUser.businessName,
      category: apiUser.category,
      description: apiUser.description,
      isStoreOpen: true,
      favorites: [],
    } as User;
  }

  if (normalizedRole === 'delivery') {
    return {
      ...base,
      role: 'delivery',
      isAvailable: true,
      vehicleType: apiUser.vehicleType || 'Bike',
      vehicleNumber: apiUser.vehicleNumber,
      verificationStatus: apiUser.verificationStatus || 'APPROVED',
      activeOrderId: null,
      completedOrdersCount: 0,
      rating: 5.0,
      totalEarnings: 0,
    } as User;
  }

  return {
    ...base,
    role: 'admin',
    permissions: ['all'],
  } as User;
};

const buildRegisterPayload = (userData: User): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
    name: userData.name,
    email: userData.email,
    password: userData.password || 'password123',
    phone: userData.phone,
    role: userData.role,
    campusId: userData.campusId,
  };
  if (userData.role === 'student') {
    const student = userData as any;
    if (student.department) payload.department = student.department;
    if (student.year) payload.year = student.year;
  }
  return payload;
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const restoreSession = async () => {
      const token = authToken.get();

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await api.me();
        const restoredUser = mapApiUserToFrontendUser(response.user);
        setUser(restoredUser);
      } catch {
        authToken.clear();
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    restoreSession();
  }, []);

  const isAuthenticated = !!user;
  const role = user?.role || null;
  const campusId = user?.campusId || null;

  const login = async (email: string, pass: string, selectedRole: Role) => {
    try {
      authToken.clear();
      const response = await api.login(email, pass, selectedRole);
      authToken.set(response.token);

      const loggedInUser = mapApiUserToFrontendUser(response.user);
      setUser(loggedInUser);

      toast.success(`Welcome back, ${loggedInUser.name}!`);
    } catch (error: any) {
      toast.error(error.message || 'Login failed');
      throw error;
    }
  };

  const register = async (userData: User) => {
    try {
      const payload = buildRegisterPayload(userData);
      const response = await api.register(payload);

      authToken.set(response.token);

      const newUser = mapApiUserToFrontendUser(response.user);
      setUser(newUser);

      toast.success('Registration successful!');
    } catch (error: any) {
      toast.error(error.message || 'Registration failed');
      throw error;
    }
  };

  const updateProfile = async (updates: Partial<User>) => {
    if (!user) {
      throw new Error('Not authenticated');
    }

    try {
      const response = await api.updateProfile(updates);
      const updatedUser = response?.data || response?.user;

      if (updatedUser) {
        setUser(mapApiUserToFrontendUser(updatedUser));
      } else {
        await refreshUser();
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const response = await api.me();
      if (response && response.user) {
        setUser(mapApiUserToFrontendUser(response.user));
      }
    } catch (err) {
      console.error('Failed to refresh user', err);
    }
  };

  const logout = () => {
    authToken.clear();
    setUser(null);
    toast.success('Successfully logged out');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        role,
        campusId,
        login,
        register,
        updateProfile,
        logout,
        refreshUser,
      }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
};