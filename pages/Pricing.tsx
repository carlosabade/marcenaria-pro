
import React, { useState } from 'react';
import { Icons } from '../components/Icon';
// Reusing logic from former PaywallModal, but integrating as a full page
import { supabase } from '../services/supabaseClient';

const Pricing = () => {
    const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
    const [mobilePlan, setMobilePlan] = useState<'monthly' | 'quarterly' | 'lifetime'>('monthly');

    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const handleSubscribe = async (plan: 'monthly' | 'quarterly' | 'lifetime') => {
        try {
            setLoadingPlan(plan);
            setErrorMessage(null); // Clear previous errors

            console.log("Iniciando checkout para plano:", plan);

            const { data, error } = await supabase.functions.invoke('create-checkout', {
                body: { plano: plan }
            });

            console.log("Resposta do Supabase Edge Function:", { data, error });

            if (error) {
                // Tentar ler o corpo da resposta de erro se for um objeto Response ou similar
                let detailedMsg = error.message;
                try {
                    if (error.context && typeof error.context.json === 'function') {
                        const errBody = await error.context.json();
                        detailedMsg = errBody.error || errBody.message || detailedMsg;
                    }
                } catch (e) { console.warn("Erro ao ler corpo do erro:", e); }

                throw new Error(detailedMsg || "Falha na comunicação com servidor (Edge Function)");
            }

            if (!data || !data.url) {
                console.error("Resposta sem URL:", data);
                throw new Error("O servidor respondeu, mas não enviou a URL de pagamento.");
            }

            console.log("Redirecionando para:", data.url);
            window.location.href = data.url;

        } catch (error: any) {
            console.error('Erro no handleSubscribe:', error);
            const msg = error.message || "Erro desconhecido ao tentar assinar.";
            setErrorMessage(msg);
            // alert("Erro: " + msg); // Opcional, mas a UI é melhor
            setLoadingPlan(null);
        }
    };

    return (
        <div className="min-h-screen bg-slate-900 pb-20">
            {/* Header Simples */}
            <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-wood-400 to-wood-600 flex items-center justify-center shadow-lg shadow-wood-900/20">
                            <Icons.Hammer className="w-5 h-5 text-white" />
                        </div>
                        <span className="font-bold text-lg tracking-tight text-white">Marcenaria <span className="text-wood-500">Pro</span></span>
                    </div>
                    <a href="/" className="text-slate-400 hover:text-white text-sm font-medium transition-colors">Voltar</a>
                </div>
            </div>

            <div className="container mx-auto px-4 py-8 text-center">
                <h1 className="text-3xl md:text-4xl font-black text-white mb-4 tracking-tight">
                    Escolha o plano ideal para <br />
                    <span className="text-wood-500">profissionalizar sua oficina</span>
                </h1>
                <p className="text-slate-400 text-lg max-w-2xl mx-auto mb-8">
                    Chega de planilhas bagunçadas. Tenha controle total de clientes, projetos e contratos em um só lugar.
                </p>

                {errorMessage && (
                    <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl max-w-lg mx-auto mb-8 text-center font-bold">
                        ⚠️ {errorMessage}
                    </div>
                )}

                {/* Tabs Mobile */}
                <div className="flex md:hidden justify-center gap-2 mb-8 bg-slate-800 p-1 rounded-xl w-fit mx-auto">
                    <button
                        onClick={() => setMobilePlan('monthly')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${loadingPlan === 'monthly' ? 'opacity-50' : ''} ${mobilePlan === 'monthly' ? 'bg-slate-700 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Mensal
                    </button>
                    <button
                        onClick={() => setMobilePlan('quarterly')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${loadingPlan === 'quarterly' ? 'opacity-50' : ''} ${mobilePlan === 'quarterly' ? 'bg-wood-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Trimestral
                    </button>
                    <button
                        onClick={() => setMobilePlan('lifetime')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${loadingPlan === 'lifetime' ? 'opacity-50' : ''} ${mobilePlan === 'lifetime' ? 'bg-wood-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'
                            }`}
                    >
                        Vitalício
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8 max-w-7xl mx-auto">
                    {/* Plano Mensal */}
                    <div className={`bg-slate-800 rounded-3xl p-6 border border-slate-700 hover:border-slate-500 transition-all flex-col text-left relative overflow-hidden group ${mobilePlan === 'monthly' ? 'flex' : 'hidden md:flex'}`}>

                        <h3 className="text-xl font-bold text-white mb-2 relative z-10">Mensal</h3>
                        <div className="flex items-baseline gap-1 mb-3 relative z-10">
                            <span className="text-slate-400">R$</span>
                            <span className="text-4xl font-black text-white">29,90</span>
                            <span className="text-slate-500">/mês</span>
                        </div>

                        <ul className="space-y-2 mb-4 flex-1 relative z-10 text-sm">
                            <li className="flex items-center gap-3 text-slate-300">
                                <Icons.Check className="w-5 h-5 text-wood-500" />
                                <span>Projetos Ilimitados</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <Icons.Check className="w-5 h-5 text-wood-500" />
                                <span>Gestão de Clientes</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <Icons.Check className="w-5 h-5 text-wood-500" />
                                <span>Contratos Automáticos</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <Icons.Check className="w-5 h-5 text-wood-500" />
                                <span>Acesso em 1 Dispositivo</span>
                            </li>
                        </ul>

                        <button
                            onClick={() => handleSubscribe('monthly')}
                            disabled={loadingPlan === 'monthly'}
                            className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-xl transition-all relative z-10 disabled:opacity-50"
                        >
                            {loadingPlan === 'monthly' ? 'Processando...' : 'Começar Mensal'}
                        </button>
                    </div>

                    {/* Plano Trimestral */}
                    <div className={`bg-slate-800 rounded-3xl p-6 border border-slate-700 hover:border-wood-500 transition-all flex-col text-left relative overflow-hidden group ${mobilePlan === 'quarterly' ? 'flex' : 'hidden md:flex'}`}>
                        <div className="absolute top-0 right-0 bg-wood-900 text-wood-400 text-xs font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest border-l border-b border-wood-800">
                            Economize 10%
                        </div>

                        <h3 className="text-xl font-bold text-white mb-2 relative z-10">Trimestral</h3>
                        <div className="flex items-baseline gap-1 mb-3 relative z-10">
                            <span className="text-slate-400">R$</span>
                            <span className="text-4xl font-black text-white">59,90</span>
                            <div className="flex flex-col text-xs text-slate-500 leading-tight ml-1">
                                <span>/trimestre</span>
                                <span>(R$ 19,96/mês)</span>
                            </div>
                        </div>

                        <ul className="space-y-2 mb-4 flex-1 relative z-10 text-sm">
                            <li className="flex items-center gap-3 text-white font-medium">
                                <Icons.Star className="w-5 h-5 text-wood-500 fill-wood-500" />
                                <span>Tudo do Plano Mensal</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <Icons.Check className="w-5 h-5 text-wood-500" />
                                <span>Renovação a cada 3 meses</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <Icons.Check className="w-5 h-5 text-wood-500" />
                                <span>Prioridade no Suporte</span>
                            </li>
                        </ul>

                        <button
                            onClick={() => handleSubscribe('quarterly')}
                            disabled={loadingPlan === 'quarterly'}
                            className="w-full bg-slate-700 hover:bg-wood-600 text-white font-bold py-3 rounded-xl transition-all relative z-10 disabled:opacity-50"
                        >
                            {loadingPlan === 'quarterly' ? 'Processando...' : 'Assinar Trimestral'}
                        </button>
                    </div>

                    {/* Plano Vitalício */}
                    <div className={`bg-gradient-to-b from-wood-900/40 to-slate-900 rounded-3xl p-6 border border-wood-600 shadow-2xl shadow-wood-900/20 flex-col text-left relative overflow-hidden transform md:-translate-y-4 ${mobilePlan === 'lifetime' ? 'flex' : 'hidden md:flex'}`}>
                        <div className="absolute top-0 right-0 bg-wood-600 text-white text-xs font-bold px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                            Mais Popular
                        </div>

                        <h3 className="text-xl font-bold text-wood-400 mb-2">Vitalício</h3>
                        <div className="flex items-baseline gap-1 mb-1">
                            <span className="text-slate-400">R$</span>
                            <span className="text-4xl font-black text-white">690,00</span>
                        </div>
                        <p className="text-slate-400 text-xs mb-4">Pagamento único. Acesso para sempre.</p>

                        <ul className="space-y-2 mb-4 flex-1 text-sm">
                            <li className="flex items-center gap-3 text-white font-medium">
                                <Icons.Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                                <span>Tudo do Plano Trimestral</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <Icons.Check className="w-5 h-5 text-wood-500" />
                                <span>Sem mensalidades</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <Icons.Check className="w-5 h-5 text-wood-500" />
                                <span>Acesso em 5 Dispositivos</span>
                            </li>
                            <li className="flex items-center gap-3 text-slate-300">
                                <Icons.Check className="w-5 h-5 text-wood-500" />
                                <span>Suporte Prioritário</span>
                            </li>
                        </ul>

                        <button
                            onClick={() => handleSubscribe('lifetime')}
                            disabled={loadingPlan === 'lifetime'}
                            className="w-full bg-wood-600 hover:bg-wood-500 text-white font-bold py-3 rounded-xl transition-all shadow-lg hover:shadow-wood-900/40 disabled:opacity-50"
                        >
                            {loadingPlan === 'lifetime' ? 'Processando...' : 'Garantir Acesso Vitalício'}
                        </button>
                    </div>
                </div>

                <div className="mt-16 pt-8 border-t border-slate-800 max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
                    <div>
                        <div className="bg-slate-800 w-10 h-10 rounded-full flex items-center justify-center mb-4 mx-auto md:mx-0">
                            <Icons.Lock className="w-5 h-5 text-slate-400" />
                        </div>
                        <h4 className="font-bold text-white mb-2">Pagamento Seguro</h4>
                        <p className="text-sm text-slate-400">Processado pelo Stripe com criptografia de ponta a ponta.</p>
                    </div>
                    <div>
                        <div className="bg-slate-800 w-10 h-10 rounded-full flex items-center justify-center mb-4 mx-auto md:mx-0">
                            <Icons.Zap className="w-5 h-5 text-slate-400" />
                        </div>
                        <h4 className="font-bold text-white mb-2">Acesso Imediato</h4>
                        <p className="text-sm text-slate-400">Seu plano é ativado automaticamente assim que o pagamento compensar.</p>
                    </div>
                    <div>
                        <div className="bg-slate-800 w-10 h-10 rounded-full flex items-center justify-center mb-4 mx-auto md:mx-0">
                            <Icons.Shield className="w-5 h-5 text-slate-400" />
                        </div>
                        <h4 className="font-bold text-white mb-2">Garantia de 7 Dias</h4>
                        <p className="text-sm text-slate-400">Se não gostar, devolvemos seu dinheiro sem perguntas.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Pricing;
