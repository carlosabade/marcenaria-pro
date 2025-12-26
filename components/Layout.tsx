
import React, { useState, useEffect } from 'react';
import { Icons } from './Icon';
import { getLastSyncDate, logoutUser } from '../services/storageService';
import { InstallPWA } from './InstallPWA';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [syncStatus, setSyncStatus] = useState<'current' | 'outdated' | 'none'>('none');

  useEffect(() => {
    const lastSync = getLastSyncDate();
    if (!lastSync) {
      setSyncStatus('none');
    } else {
      const hoursSinceSync = (new Date().getTime() - new Date(lastSync).getTime()) / (1000 * 60 * 60);
      setSyncStatus(hoursSinceSync < 24 ? 'current' : 'outdated');
    }
  }, [activeTab]); // Atualiza ao mudar de aba

  const navItems = [
    { id: 'dashboard', label: 'Visão Geral', icon: Icons.Dashboard },
    { id: 'projects', label: 'Projetos', icon: Icons.Hammer },
    { id: 'clients', label: 'Clientes', icon: Icons.Users },
    { id: 'catalog', label: 'Catálogo MDF', icon: Icons.Book },
    { id: 'ai-studio', label: 'Laboratório IA', icon: Icons.Zap },
    { id: 'settings', label: 'Configurações', icon: Icons.Settings },
    { id: 'admin', label: 'Administração', icon: Icons.Shield },
  ];

  return (
    <div className="flex flex-col h-screen bg-slate-900">
      <header className="bg-slate-800 border-b border-slate-700 h-16 flex items-center justify-between px-4 md:px-6 shrink-0 z-50 relative">
        <div className="flex items-center gap-3">
          <div className="bg-wood-600 p-2 rounded-lg">
            <Icons.Hammer className="text-white w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">
            Marcenaria<span className="text-wood-500">Pro</span>
          </h1>
        </div>

        <nav className="hidden md:flex gap-6 absolute left-1/2 transform -translate-x-1/2">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => item.id === 'admin' ? window.location.href = '/admin' : setActiveTab(item.id)}
              className={`flex items-center gap-2 text-sm font-medium transition-colors ${activeTab === item.id ? 'text-wood-400' : 'text-slate-400 hover:text-white'
                }`}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <InstallPWA />
          {/* Cloud Status Indicator */}
          <button
            onClick={() => setActiveTab('settings')}
            className={`p-2 rounded-full transition-all flex items-center gap-1 group relative`}
            title={syncStatus === 'current' ? 'Backup em dia' : 'Backup necessário'}
          >
            <Icons.Box className={`w-5 h-5 ${syncStatus === 'current' ? 'text-green-500' :
              syncStatus === 'outdated' ? 'text-orange-500 animate-pulse' :
                'text-slate-500'
              }`} />
            <div className={`w-2 h-2 rounded-full absolute top-1 right-1 border border-slate-800 ${syncStatus === 'current' ? 'bg-green-500' :
              syncStatus === 'outdated' ? 'bg-orange-500' :
                'bg-slate-600'
              }`}></div>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`p-2 rounded-full transition-colors ${activeTab === 'settings' ? 'bg-wood-900/50 text-wood-400' : 'text-slate-300 hover:bg-slate-700 hover:text-white'}`}
            title="Meu Perfil"
          >
            <Icons.User className="w-5 h-5" />
          </button>

          <button
            onClick={() => {
              if (confirm("Tem certeza que deseja sair?")) {
                logoutUser().then(() => window.location.reload());
              }
            }}
            className="text-slate-300 p-2 hover:bg-red-900/20 hover:text-red-400 rounded-full transition-colors"
            title="Sair do Sistema"
          >
            <Icons.LogOut className="w-5 h-5" />
          </button>

          <button
            className="md:hidden text-slate-300 p-2 hover:bg-slate-700 rounded-lg transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <Icons.Close /> : <Icons.Menu />}
          </button>
        </div>
      </header>

      {mobileMenuOpen && (
        <div className="fixed inset-0 top-16 bg-slate-900 z-40 p-4 md:hidden animate-fade-in overflow-y-auto">
          <div className="flex flex-col gap-3">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`flex items-center gap-4 p-4 rounded-xl transition-all border ${activeTab === item.id
                  ? 'bg-wood-900/20 text-wood-400 border-wood-600/50 shadow-lg shadow-wood-900/20'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                  }`}
              >
                <div className={`p-2 rounded-lg ${activeTab === item.id ? 'bg-wood-600 text-white' : 'bg-slate-900 text-slate-400'}`}>
                  <item.icon className="w-6 h-6" />
                </div>
                <span className="font-bold text-lg">{item.label}</span>
                {activeTab === item.id && <Icons.ChevronRight className="w-5 h-5 ml-auto opacity-50" />}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className={`flex-1 relative z-0 no-scrollbar ${activeTab === 'ai-studio' ? 'p-0 overflow-hidden' : 'p-4 md:p-8 overflow-y-auto'}`}>
        <div className={activeTab === 'ai-studio' ? 'h-full w-full' : 'max-w-7xl mx-auto'}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
