import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Role } from '@/types';

type ProtectedRouteProps = {
    children: ReactNode;
    role?: Role;
};

export const ProtectedRoute = ({ children, role }: ProtectedRouteProps) => {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return null;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (role && user.role !== role) {
        // If you try to access the wrong role's route, bounce you to your own
        if (user.role === 'student') {
            return <Navigate to="/" replace />;
        }
        return <Navigate to={`/${user.role}`} replace />;
    }

    return <>{children}</>;
};