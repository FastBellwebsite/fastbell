import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Role } from '@/types';
import { api, authToken } from '@/services/api';
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
};

const AuthContext = createContext<AuthContextValue | null>(null);

const mapApiUserToFrontendUser = (apiUser: any): User => {
  const base = {
    id: apiUser.id,
    name: apiUser.name,
    email: apiUser.email,
    phone: apiUser.phone || '',
    role: apiUser.role as Role,
    campusId: apiUser.campusId || 'sns',
    status: apiUser.status || 'Active',
    addresses: apiUser.addresses || [],
  };

  if (apiUser.role === 'student') {
    return {
      ...base,
      role: 'student',
      department: apiUser.department,
      year: apiUser.year,
      addresses: apiUser.addresses || [],
      location: apiUser.location,
      favorites: [],
    } as User;
  }

  if (apiUser.role === 'vendor') {
    return {
      ...base,
      role: 'vendor',
      storeId: apiUser.storeId || '',
      storeName: apiUser.storeName,
      businessName: apiUser.businessName,
      category: apiUser.category,
      description: apiUser.description,
      location: apiUser.location,
    } as User;
  }

  if (apiUser.role === 'delivery') {
    return {
      ...base,
      role: 'delivery',
      serviceArea: apiUser.serviceArea,
      vehicleType: apiUser.vehicleType,
      vehicleNumber: apiUser.vehicleNumber,
      availabilityStatus: apiUser.availabilityStatus || 'Offline',
      location: apiUser.location,
    } as User;
  }

  return {
    ...base,
    role: 'admin',
    permissions: apiUser.permissions || [],
  } as User;
};

const buildRegisterPayload = (userData: User) => {
  const payload: Record<string, unknown> = {
    name: userData.name,
    email: userData.email,
    phone: userData.phone,
    password: userData.password,
    role: userData.role,
    campusId: userData.campusId || 'sns',
  };

  if (userData.role === 'student') {
    payload.department = userData.department;
    payload.year = userData.year;

    const address = userData.addresses?.[0];

    payload.address = address?.line || userData.deliveryLocation;
    payload.locality = address?.locality || userData.location?.locality;
    payload.city = address?.city || userData.location?.city;
    payload.state = address?.state || userData.location?.state;
    payload.postalCode = address?.postalCode || userData.location?.postalCode;
    payload.landmark = address?.landmark;
  }

  if (userData.role === 'vendor') {
    payload.storeName = userData.storeName || userData.businessName;
    payload.category = userData.category;
    payload.description = userData.description;

    payload.address = userData.location?.address;
    payload.locality = userData.location?.locality;
    payload.city = userData.location?.city;
    payload.state = userData.location?.state;
    payload.postalCode = userData.location?.postalCode;
  }

  if (userData.role === 'delivery') {
    payload.serviceArea = userData.serviceArea;
    payload.vehicleType = userData.vehicleType;
    payload.vehicleNumber = userData.vehicleNumber;

    payload.address = userData.location?.address;
    payload.locality = userData.location?.locality;
    payload.city = userData.location?.city;
    payload.state = userData.location?.state;
    payload.postalCode = userData.location?.postalCode;
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
      }}
    >
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