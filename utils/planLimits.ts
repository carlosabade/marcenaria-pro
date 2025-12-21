
export type PlanType = 'free' | 'monthly' | 'quarterly' | 'lifetime';

export interface PlanLimits {
    projects: number; // -1 = unlimited
    clients: number;  // -1 = unlimited
    pdfExport: boolean;
    templates: 'basic' | 'all';
}

export const PLAN_LIMITS: Record<PlanType, PlanLimits> = {
    free: {
        projects: 3,
        clients: 5,
        pdfExport: false,
        templates: 'basic'
    },
    monthly: {
        projects: -1,
        clients: -1,
        pdfExport: true,
        templates: 'all'
    },
    quarterly: {
        projects: -1,
        clients: -1,
        pdfExport: true,
        templates: 'all'
    },
    lifetime: {
        projects: -1,
        clients: -1,
        pdfExport: true,
        templates: 'all'
    }
};

export const getPlanLimits = (plan: PlanType): PlanLimits => {
    return PLAN_LIMITS[plan] || PLAN_LIMITS.free;
};

export const isPaidPlan = (plan: PlanType): boolean => {
    return plan !== 'free';
};
