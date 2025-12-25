import React, { useState, useEffect } from 'react';
import { usePWA } from '../hooks/usePWA';
import { Download, X, Smartphone, Check } from 'lucide-react';
import { Icons } from './Icon';

export const InstallPWA: React.FC = () => {
    const { isInstallable, isInstalled, install } = usePWA();
    const [showIOSPrompt, setShowIOSPrompt] = useState(false);
    const [showAutoModal, setShowAutoModal] = useState(false);

    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    useEffect(() => {
        // Auto-show modal if installable and not dismissed recently
        if (isInstallable && !isInstalled) {
            const hasDismissed = sessionStorage.getItem('pwa_install_dismissed');
            if (!hasDismissed) {
                // Small delay to not be annoying immediately on load
                const timer = setTimeout(() => setShowAutoModal(true), 2000);
                return () => clearTimeout(timer);
            }
        }
    }, [isInstallable, isInstalled]);

    const handleDismiss = () => {
        setShowAutoModal(false);
        sessionStorage.setItem('pwa_install_dismissed', 'true');
    };

    const handleInstall = () => {
        if (isIOS) {
            setShowIOSPrompt(true);
            setShowAutoModal(false);
        } else {
            install();
            setShowAutoModal(false);
        }
    };

    // Always render the small button in header if applicable
    const shouldShowButton = !isInstalled && (isInstallable || isIOS);

    if (!shouldShowButton) return null;

    return (
        <>
            {/* Header Mini Button */}
            <button
                onClick={handleInstall}
                className="flex items-center gap-2 bg-wood-600 hover:bg-wood-500 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-lg transition-all"
                title="Instalar Aplicativo"
            >
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">Instalar App</span>
            </button>

            {/* Auto Modal (App Store Style) */}
            {showAutoModal && (
                <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 animate-fade-in bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden relative animate-slide-up sm:animate-scale-in">
                        <button
                            onClick={handleDismiss}
                            className="absolute top-3 right-3 p-1 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>

                        <div className="p-6 text-center">
                            <div className="w-20 h-20 bg-wood-600 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-wood-600/30">
                                <Icons.Hammer className="w-10 h-10 text-white" />
                            </div>

                            <h2 className="text-xl font-bold text-slate-900 mb-1">MarcenariaPro</h2>
                            <p className="text-sm text-slate-500 mb-6">Instale o aplicativo oficial para melhor performance e acesso offline.</p>

                            <div className="grid grid-cols-2 gap-3 mb-6 text-left">
                                <div className="bg-slate-50 p-3 rounded-lg flex items-center gap-2">
                                    <div className="bg-green-100 p-1.5 rounded-full">
                                        <Check className="w-3 h-3 text-green-700" />
                                    </div>
                                    <span className="text-xs font-medium text-slate-600">Funciona Offline</span>
                                </div>
                                <div className="bg-slate-50 p-3 rounded-lg flex items-center gap-2">
                                    <div className="bg-blue-100 p-1.5 rounded-full">
                                        <Smartphone className="w-3 h-3 text-blue-700" />
                                    </div>
                                    <span className="text-xs font-medium text-slate-600">Tela Cheia</span>
                                </div>
                            </div>

                            <button
                                onClick={handleInstall}
                                className="w-full bg-wood-600 hover:bg-wood-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-wood-600/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Download className="w-5 h-5" />
                                Instalar Agora
                            </button>

                            <button
                                onClick={handleDismiss}
                                className="mt-3 text-xs text-slate-400 font-medium hover:text-slate-600"
                            >
                                Agora não
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* iOS Instructions Modal */}
            {showIOSPrompt && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-end sm:items-center justify-center p-4 animate-fade-in" onClick={() => setShowIOSPrompt(false)}>
                    <div className="bg-white text-slate-900 p-6 rounded-2xl max-w-sm w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowIOSPrompt(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                            <X className="w-5 h-5" />
                        </button>
                        <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                            <Download className="w-5 h-5 text-wood-600" />
                            Instalar no iPhone
                        </h3>
                        <ol className="space-y-4 text-sm text-slate-600">
                            <li className="flex items-start gap-3">
                                <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-500">1</span>
                                <div>
                                    Toque no botão <strong>Compartilhar</strong> <br />
                                    <span className="text-xs text-slate-400">(Ícone quadrado com seta pra cima na barra inferior)</span>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-500">2</span>
                                <div>
                                    Role para baixo e toque em <br />
                                    <strong>"Adicionar à Tela de Início"</strong>
                                    <div className="mt-1 flex items-center gap-1 text-xs bg-slate-100 w-fit px-2 py-1 rounded">
                                        <span>➕</span> Adicionar à Tela de Início
                                    </div>
                                </div>
                            </li>
                            <li className="flex items-start gap-3">
                                <span className="bg-slate-100 px-2 py-0.5 rounded font-bold text-slate-500">3</span>
                                <div>
                                    Confirme clicando em <strong>Adicionar</strong> no topo.
                                </div>
                            </li>
                        </ol>
                    </div>
                </div>
            )}
        </>
    );
};
