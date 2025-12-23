import React from 'react';
import { usePWA } from '../hooks/usePWA';
import { Download } from 'lucide-react';

export const InstallPWA: React.FC = () => {
    const { isInstallable, install } = usePWA();

    if (!isInstallable) return null;

    return (
        <button
            onClick={install}
            className="flex items-center gap-2 bg-wood-600 hover:bg-wood-500 text-white text-xs font-bold px-3 py-2 rounded-lg shadow-lg animate-pulse transition-all"
            title="Instalar Aplicativo"
        >
            <Download className="w-4 h-4" />
            <span className="hidden md:inline">Instalar App</span>
        </button>
    );
};
