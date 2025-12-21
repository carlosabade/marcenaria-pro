import React, { useState } from 'react';
import { Icons } from './Icon';
// Fix: added getDeviceLimit to the import list from storageService
import { upgradeSubscription, getDeviceLimit } from '../services/storageService';
import { supabase } from '../services/supabaseClient';
import { SubscriptionPlan } from '../types';

interface PaywallModalProps {
    onClose: () => void;
    onSuccess: () => void;
}


const PaywallModal: React.FC<PaywallModalProps> = ({ onClose, onSuccess }) => {
    const [step, setStep] = useState<'plans' | 'checkout'>('plans');
    const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan | null>(null);

    const handleSelectPlan = (plan: SubscriptionPlan) => {
        setSelectedPlan(plan);
        setStep('checkout');
    };

    // Função para chamar o Checkout no Backend (Edge Function)
    const handleGoToStripe = async () => {
        if (!selectedPlan || selectedPlan === 'free') return;

        try {
            // Mostra loading se quiser (pode ser um estado local)
            const btn = document.getElementById('btn-checkout');
            if (btn) btn.innerText = "Carregando...";

            const { data, error } = await supabase.functions.invoke('create-checkout', {
                body: { plano: selectedPlan }
            });

            if (error) throw error;
            if (!data.url) throw new Error("URL de checkout não retornada");

            // Redireciona para o Stripe
            window.location.href = data.url;

        } catch (err: any) {
            console.error("Erro ao iniciar checkout:", err);
            alert("Erro ao iniciar pagamento: " + (err.message || "Tente novamente."));
            const btn = document.getElementById('btn-checkout');
            if (btn) btn.innerText = "Ir para Pagamento Seguro";
        }
    };

    const PlanCard = ({ plan, title, price, subtitle, limit, highlighted = false }: any) => (
        <div
            className={`flex flex-col p-6 rounded-2xl border-2 transition-all cursor-pointer relative ${highlighted
                ? 'bg-gradient-to-b from-wood-900/40 to-slate-900 border-wood-600 shadow-2xl scale-105 z-10'
                : 'bg-slate-900 border-slate-700 hover:border-slate-500 scale-100 opacity-90 hover:opacity-100'
                }`}
            onClick={() => handleSelectPlan(plan)}
        >
            {highlighted && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-wood-600 text-white text-[10px] font-bold py-1 px-4 rounded-full uppercase tracking-widest shadow-lg">
                    Mais Popular
                </div>
            )}
            <h3 className={`text-xl font-bold mb-1 ${highlighted ? 'text-wood-400' : 'text-white'}`}>{title}</h3>
            <p className="text-slate-500 text-xs mb-4">{subtitle}</p>
            <div className="flex items-baseline gap-1 mb-6">
                <span className="text-slate-400 text-sm">R$</span>
                <span className="text-4xl font-black text-white">{price}</span>
                {plan === 'monthly' && <span className="text-slate-500 text-sm">/mês</span>}
            </div>
            <ul className="space-y-3 mb-8 flex-1">
                <li className="flex items-center gap-2 text-sm text-slate-300"><Icons.Shield className="w-4 h-4 text-green-500" /> Downloads Ilimitados</li>
                <li className="flex items-center gap-2 text-sm text-slate-300"><Icons.Shield className="w-4 h-4 text-green-500" /> Backup em Nuvem Realtime</li>
                <li className="flex items-center gap-2 text-sm text-slate-300"><Icons.Shield className="w-4 h-4 text-green-500" /> <strong>{limit}</strong> Dispositivo{limit > 1 ? 's' : ''}</li>
            </ul>
            <button className={`w-full py-4 rounded-xl font-bold transition-all shadow-md ${highlighted ? 'bg-wood-600 text-white hover:bg-wood-500' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                Assinar Plano
            </button>
        </div>
    );

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-fade-in overflow-y-auto">
            <div className="bg-slate-800 rounded-3xl border border-slate-700 shadow-2xl w-full max-w-4xl relative overflow-hidden">
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-400 hover:text-white bg-slate-700/50 p-2 rounded-full z-20">
                    <Icons.Close className="w-5 h-5" />
                </button>

                {step === 'plans' ? (
                    <div className="p-8 md:p-12 text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-wood-900/30 rounded-full mb-6 text-wood-500">
                            <Icons.Zap className="w-10 h-10" />
                        </div>
                        <h2 className="text-4xl font-black text-white mb-3 tracking-tight">Evolua sua Marcenaria</h2>
                        <p className="text-slate-400 text-lg mb-12 max-w-2xl mx-auto">
                            Tudo o que você precisa para gerenciar sua oficina com profissionalismo e segurança total dos seus dados.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
                            <PlanCard
                                plan="monthly"
                                title="Plano Mensal"
                                subtitle="Ideal para começar"
                                price="29,90"
                                limit={1}
                            />
                            <PlanCard
                                plan="lifetime"
                                title="Acesso Vitalício"
                                subtitle="Pagamento único, oficina sem limites"
                                price="690,00"
                                limit={5}
                                highlighted={true}
                            />
                        </div>
                        <p className="mt-8 text-xs text-slate-500 font-medium">Pagamento seguro processado mundialmente pelo Stripe.</p>
                    </div>
                ) : (
                    <div className="p-8 md:p-12 flex flex-col items-center justify-center text-center">
                        <button onClick={() => setStep('plans')} className="absolute top-8 left-8 text-slate-400 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                            <Icons.ChevronRight className="w-4 h-4 rotate-180" /> Voltar aos Planos
                        </button>

                        <div className="w-20 h-20 bg-green-900/30 rounded-full flex items-center justify-center mb-6">
                            <Icons.Shield className="w-10 h-10 text-green-500" />
                        </div>

                        <h2 className="text-3xl font-black text-white mb-4">Finalizar no Stripe</h2>
                        <p className="text-slate-400 max-w-md mb-8">
                            Você escolheu o plano <strong className="text-white">{selectedPlan === 'monthly' ? 'Mensal' : 'Vitalício'}</strong>.
                            Clique abaixo para ser redirecionado para a página de pagamento seguro.
                        </p>

                        <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 max-w-sm w-full mb-8">
                            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-4">
                                <span className="text-slate-400">Plano Selecionado</span>
                                <span className="text-white font-bold uppercase">{selectedPlan}</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-slate-400">Total a Pagar</span>
                                <span className="text-2xl text-wood-500 font-bold">
                                    R$ {selectedPlan === 'monthly' ? '29,90' : '690,00'}
                                </span>
                            </div>
                        </div>

                        <button
                            id="btn-checkout"
                            onClick={handleGoToStripe}
                            className="bg-wood-600 hover:bg-wood-500 text-white text-lg font-bold py-4 px-12 rounded-2xl shadow-xl transition-transform hover:scale-105 flex items-center gap-3"
                        >
                            Ir para Pagamento Seguro <Icons.ChevronRight className="w-6 h-6" />
                        </button>

                        <p className="mt-6 text-xs text-slate-500 flex items-center gap-1">
                            <Icons.Lock className="w-3 h-3" /> Ambiente criptografado de ponta a ponta
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default PaywallModal;