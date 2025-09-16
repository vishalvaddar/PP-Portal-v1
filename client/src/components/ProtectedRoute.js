import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { SystemConfigProvider } from '../contexts/SystemConfigContext';

const ProtectedRoute = () => {
    const { user, loading } = useAuth();

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return (
        <SystemConfigProvider>
                <Outlet />
        </SystemConfigProvider>
    );
};

export default ProtectedRoute;