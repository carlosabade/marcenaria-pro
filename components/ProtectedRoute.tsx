
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';
import { Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireSubscription?: boolean;
    user: any; // Using any or UserProfile to avoid circular types if not easy to import
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireSubscription = false, user }) => {
    const { isActive, loading: subLoading } = useSubscription();

    // If we are here, App.tsx has already determined 'loading' is false.
    // So we just check 'user'.

    if (subLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <Loader2 className="w-10 h-10 text-wood-500 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    if (requireSubscription && !isActive) {
        return <Navigate to="/pricing" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
