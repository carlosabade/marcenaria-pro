import React from 'react';
import { usePWA } from '../hooks/usePWA';
import { Download } from 'lucide-react';

export const InstallPWA: React.FC = () => {
    const { isInstallable, isInstalled, install } = usePWA();
    const [showIOSPrompt, setShowIOSPrompt] = React.useState(false);

    // Detect iOS
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;

    // Show button if:
    // 1. Browser fired 'beforeinstallprompt' (Android/Desktop)
    // 2. Or it's iOS and NOT already installed (since iOS doesn't fire the event)
    const shouldShow = !isInstalled && (isInstallable || isIOS);

    if (!shouldShow) return null;

    return (
        <>
            <button
                onClick={() => isIOS ? setShowIOSPrompt(true) : install()}
                className="flex items-center gap-2 bg-wood-600 hover:bg-wood-500 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-lg animate-pulse transition-all"
                title="Instalar Aplicativo"
            >
                <Download className="w-4 h-4" />
                <span className="hidden md:inline">Instalar App</span>
            </button>

            {/* iOS Instructions Modal */}
            {showIOSPrompt && (
                <div className="fixed inset-0 bg-black/80 z-[100] flex items-end sm:items-center justify-center p-4 animate-fade-in" onClick={() => setShowIOSPrompt(false)}>
                    <div className="bg-white text-slate-900 p-6 rounded-2xl max-w-sm w-full shadow-2xl relative" onClick={e => e.stopPropagation()}>
                        <button onClick={() => setShowIOSPrompt(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
                            ✕
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
