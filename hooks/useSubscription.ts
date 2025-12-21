
import { useState, useEffect } from 'react';
import { supabase } from '../services/supabaseClient';

export interface Subscription {
    id: string;
    user_id: string;
    status: 'active' | 'cancelled' | 'past_due';
    plano: 'monthly' | 'quarterly' | 'lifetime';
    current_period_end?: string;
    cancel_at_period_end?: boolean;
    created_at: string;
}

export const useSubscription = () => {
    const [subscription, setSubscription] = useState<Subscription | null>(null);
    const [isActive, setIsActive] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        async function getSubscription() {
            try {
                const { data: { user } } = await supabase.auth.getUser();

                if (!user) {
                    if (mounted) {
                        setSubscription(null);
                        setIsActive(false);
                        setLoading(false);
                    }
                    return;
                }

                const { data, error } = await supabase
                    .from('subscriptions')
                    .select('*')
                    .eq('user_id', user.id)
                    .eq('status', 'active')
                    .single();

                if (error && error.code !== 'PGRST116') { // PGRST116 is "Row not found"
                    console.error('Error fetching subscription:', error);
                }

                if (mounted) {
                    if (data) {
                        setSubscription(data as Subscription);
                        setIsActive(data.status === 'active');
                    } else {
                        setSubscription(null);
                        setIsActive(false);
                    }
                    setLoading(false);
                }
            } catch (error) {
                console.error('Error in useSubscription:', error);
                if (mounted) setLoading(false);
            }
        }

        getSubscription();

        // Subscribe to realtime changes
        const channel = supabase
            .channel('subscription-changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'subscriptions' },
                () => {
                    getSubscription();
                }
            )
            .subscribe();

        return () => {
            mounted = false;
            supabase.removeChannel(channel);
        };
    }, []);

    return {
        subscription,
        isActive,
        loading,

        // Plan limit helpers
        isPaid: isActive,

        canCreateProject: (currentCount: number) => {
            if (!isActive) {
                // Free plan: limit to 3 projects
                return currentCount < 3;
            }
            // Paid plans: unlimited
            return true;
        },

        canAddClient: (currentCount: number) => {
            if (!isActive) {
                // Free plan: limit to 5 clients
                return currentCount < 5;
            }
            // Paid plans: unlimited
            return true;
        },

        canExportPDF: () => isActive,

        getProjectLimit: () => isActive ? -1 : 3,

        getClientLimit: () => isActive ? -1 : 5,
    };
};
