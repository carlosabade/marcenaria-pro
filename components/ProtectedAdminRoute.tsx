import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { getUser } from '../services/storageService';
import { UserProfile } from '../types';
import { supabase } from '../services/supabaseClient';
import { Loader2 } from 'lucide-react';

interface ProtectedAdminRouteProps {
    children: React.ReactNode;
}

const ProtectedAdminRoute: React.FC<ProtectedAdminRouteProps> = ({ children }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    useEffect(() => {
        const checkAdmin = async () => {
            // 1. Check local storage first (fast)
            const localUser = getUser();
            if (localUser?.role === 'admin') {
                setIsAdmin(true);
                setIsLoading(false);
                return;
            }

            // 2. Check Supabase (authoritative source)
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data } = await supabase
                        .from('profiles')
                        .select('role')
                        .eq('email', user.email)
                        .single();

                    if (data?.role === 'admin') {
                        setIsAdmin(true);
                    }
                }
            } catch (error) {
                console.error('Error checking admin role:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkAdmin();
    }, []);

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-slate-900">
                <Loader2 className="w-8 h-8 text-wood-500 animate-spin" />
            </div>
        );
    }

    if (!isAdmin) {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default ProtectedAdminRoute;
