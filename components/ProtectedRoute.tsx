
import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSubscription } from '../hooks/useSubscription';
import { Loader2 } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

interface ProtectedRouteProps {
    children: React.ReactNode;
    requireSubscription?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requireSubscription = false }) => {
    const { isActive, loading: subLoading } = useSubscription();
    const [session, setSession] = React.useState<any>(null);
    const [authLoading, setAuthLoading] = React.useState(true);

    React.useEffect(() => {
        // Assuming 'supabase' is imported or available in this scope
        // For example: import { supabase } from '../utils/supabaseClient';
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setAuthLoading(false);
        });
    }, []);

    // We might also want to check for auth session here if not already handled globally.
    // For now, assuming App's auth check covers basic login.

    if (authLoading || subLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-900">
                <Loader2 className="w-10 h-10 text-wood-500 animate-spin" />
            </div>
        );
    }

    if (!session) {
        return <Navigate to="/login" replace />;
    }

    if (requireSubscription && !isActive) {
        return <Navigate to="/pricing" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
