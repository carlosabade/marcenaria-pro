
import React from 'react';
import { useSubscription } from '../hooks/useSubscription';
import { Icons } from './Icon';

const SubscriptionStatus: React.FC = () => {
    const { subscription, isActive, loading } = useSubscription();

    if (loading) return <div className="animate-pulse h-10 w-32 bg-slate-800 rounded"></div>;

    if (!isActive) {
        return (
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="bg-slate-700 p-3 rounded-full">
                        <Icons.Lock className="w-6 h-6 text-slate-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold">Modo Gratuito</h3>
                        <p className="text-slate-400 text-sm">Atualize para o plano Pro para liberar todos os recursos.</p>
                    </div>
                </div>
                <a
                    href="/pricing"
                    className="bg-wood-600 hover:bg-wood-500 text-white font-bold py-2 px-6 rounded-lg transition-colors text-sm whitespace-nowrap"
                >
                    Ver Planos
                </a>
            </div>
        );
    }

    return (
        <div className="bg-wood-900/20 border border-wood-600/30 rounded-xl p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-4">
                <div className="bg-wood-600/20 p-3 rounded-full">
                    <Icons.Zap className="w-6 h-6 text-wood-500" />
                </div>
                <div>
                    <h3 className="text-white font-bold flex items-center gap-2">
                        Plano {subscription?.plano === 'lifetime' ? 'Vitalício' : subscription?.plano === 'monthly' ? 'Mensal' : 'Pro'}
                        <span className="bg-wood-600 text-[10px] px-2 py-0.5 rounded-full uppercase tracking-wider">Ativo</span>
                    </h3>
                    <p className="text-wood-200 text-sm">Obrigado por apoiar o desenvolvimento!</p>
                </div>
            </div>

            {subscription?.plano !== 'lifetime' && (
                <button className="text-wood-400 hover:text-wood-300 text-xs font-medium underline">
                    Gerenciar Assinatura
                </button>
            )}
        </div>
    );
};

export default SubscriptionStatus;
