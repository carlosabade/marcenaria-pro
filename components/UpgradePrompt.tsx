
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Lock, Check } from 'lucide-react';

interface UpgradePromptProps {
    isOpen: boolean;
    onClose: () => void;
    feature: 'projects' | 'clients' | 'pdf' | 'templates';
    currentCount?: number;
    limit?: number;
}

const FEATURE_MESSAGES = {
    projects: {
        title: 'Limite de Projetos Atingido (Plano Gratuito)',
        description: 'Você atingiu o limite de 3 projetos do plano gratuito.',
        benefit: 'Projetos ilimitados'
    },
    clients: {
        title: 'Limite de Clientes Atingido',
        description: 'Você atingiu o limite de 5 clientes do plano gratuito.',
        benefit: 'Clientes ilimitados'
    },
    pdf: {
        title: 'Exportação PDF Indisponível',
        description: 'A exportação de PDF está disponível apenas para planos pagos.',
        benefit: 'Exportação ilimitada de PDFs'
    },
    templates: {
        title: 'Templates Premium',
        description: 'Templates premium estão disponíveis apenas para planos pagos.',
        benefit: 'Acesso a todos os templates'
    }
};

export const UpgradePrompt: React.FC<UpgradePromptProps> = ({
    isOpen,
    onClose,
    feature,
    currentCount,
    limit
}) => {
    const navigate = useNavigate();
    const message = FEATURE_MESSAGES[feature];

    if (!isOpen) return null;

    const handleUpgrade = () => {
        navigate('/pricing');
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-700 relative">
                {/* Close Button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>

                {/* Icon */}
                <div className="w-16 h-16 bg-wood-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Lock className="w-8 h-8 text-wood-500" />
                </div>

                {/* Title */}
                <h2 className="text-2xl font-bold text-white text-center mb-2">
                    {message.title}
                </h2>

                {/* Description */}
                <p className="text-slate-400 text-center mb-4">
                    {message.description}
                </p>

                {/* Current Usage (if applicable) */}
                {currentCount !== undefined && limit !== undefined && (
                    <div className="bg-slate-900/50 rounded-lg p-3 mb-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-slate-400">Uso atual:</span>
                            <span className="text-white font-bold">
                                {currentCount} / {limit}
                            </span>
                        </div>
                        <div className="mt-2 bg-slate-700 rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-wood-500 h-full transition-all"
                                style={{ width: `${(currentCount / limit) * 100}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* Benefits */}
                <div className="bg-gradient-to-br from-wood-600/10 to-wood-500/10 rounded-lg p-4 mb-6 border border-wood-600/20">
                    <div className="flex items-start gap-3">
                        <Check className="w-5 h-5 text-wood-500 mt-0.5 flex-shrink-0" />
                        <div>
                            <p className="text-white font-semibold mb-1">
                                Desbloqueie com o Plano Pro
                            </p>
                            <p className="text-slate-300 text-sm">
                                {message.benefit} e muito mais
                            </p>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition-colors"
                    >
                        Agora Não
                    </button>
                    <button
                        onClick={handleUpgrade}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-wood-600 to-wood-500 hover:from-wood-500 hover:to-wood-400 text-white rounded-xl font-semibold shadow-lg shadow-wood-900/20 transition-all"
                    >
                        Ver Planos
                    </button>
                </div>
            </div>
        </div>
    );
};
