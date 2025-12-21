
import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Icons } from '../components/Icon';
import { useSubscription } from '../hooks/useSubscription';

const CheckoutSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isActive } = useSubscription();
    const [countdown, setCountdown] = useState(5);

    useEffect(() => {
        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    navigate('/'); // Go to dashboard
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [navigate]);

    return (
        <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-3xl p-8 md:p-12 max-w-lg w-full text-center border border-slate-700 shadow-2xl">
                <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
                    <Icons.Check className="w-12 h-12 text-green-500" />
                </div>

                <h1 className="text-3xl font-black text-white mb-4">Pagamento Confirmado!</h1>
                <p className="text-slate-400 text-lg mb-8">
                    Sua assinatura foi ativada com sucesso. Você agora tem acesso profissional ao Marcenaria Pro.
                </p>

                <div className="bg-slate-900 rounded-xl p-4 mb-8 border border-slate-700">
                    <p className="text-sm text-slate-500 mb-1">Redirecionando para o Dashboard em</p>
                    <p className="text-2xl font-bold text-white">{countdown}s</p>
                </div>

                <button
                    onClick={() => navigate('/')}
                    className="w-full bg-wood-600 hover:bg-wood-500 text-white font-bold py-3 rounded-xl transition-colors"
                >
                    Acessar Dashboard Agora
                </button>
            </div>
        </div>
    );
};

export default CheckoutSuccess;
