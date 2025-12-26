import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Icons } from './Icon';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const menuItems = [
        { id: 'dashboard', label: 'Dashboard', path: '/admin', icon: Icons.Dashboard },
        { id: 'products', label: 'Catálogo', path: '/admin/products', icon: Icons.Book },
        { id: 'brands', label: 'Marcas (PDF)', path: '/admin/brands', icon: Icons.Building },
        { id: 'builder', label: 'Criador de Blocos', path: '/admin/builder', icon: Icons.PenTool },
        { id: 'users', label: 'Usuários', path: '/admin/users', icon: Icons.Users },
        { id: 'settings', label: 'Configurações', path: '/admin/settings', icon: Icons.Settings },
    ];

    return (
        <div className="flex h-screen bg-slate-100 text-slate-800 font-sans">
            {/* Sidebar (Desktop) */}
            <aside
                className={`hidden md:flex ${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 text-white transition-all duration-300 flex-col shadow-xl z-20`}
            >
                <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
                    {sidebarOpen ? (
                        <span className="font-bold text-lg tracking-wider text-wood-500">ADMIN</span>
                    ) : (
                        <Icons.Shield className="w-8 h-8 text-wood-500 mx-auto" />
                    )}
                    <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-400 hover:text-white">
                        {sidebarOpen ? <Icons.ChevronRight className="rotate-180" /> : <Icons.Menu />}
                    </button>
                </div>

                <nav className="flex-1 py-6 space-y-1 px-2">
                    {menuItems.map(item => {
                        const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                        return (
                            <button
                                key={item.id}
                                onClick={() => navigate(item.path)}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${isActive
                                    ? 'bg-wood-600 text-white shadow-md'
                                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                                    } ${!sidebarOpen && 'justify-center'}`}
                                title={!sidebarOpen ? item.label : ''}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                                {sidebarOpen && <span className="font-medium">{item.label}</span>}
                            </button>
                        )
                    })}
                </nav>

                <div className="p-4 border-t border-slate-700">
                    <button
                        onClick={() => navigate('/')}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-slate-400 hover:bg-red-900/20 hover:text-red-400 transition-colors ${!sidebarOpen && 'justify-center'}`}
                    >
                        <Icons.LogOut className="w-5 h-5" />
                        {sidebarOpen && <span>Sair do Admin</span>}
                    </button>
                </div>
            </aside>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div className="fixed inset-0 z-50 bg-slate-900 text-white md:hidden flex flex-col animate-in slide-in-from-left duration-200">
                    <div className="h-16 flex items-center justify-between px-4 border-b border-slate-700">
                        <span className="font-bold text-lg tracking-wider text-wood-500">ADMIN MENU</span>
                        <button onClick={() => setMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                            <Icons.Close className="w-6 h-6" />
                        </button>
                    </div>
                    <nav className="flex-1 overflow-y-auto p-4 space-y-2">
                        {menuItems.map(item => {
                            const isActive = location.pathname === item.path || (item.path !== '/admin' && location.pathname.startsWith(item.path));
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => {
                                        navigate(item.path);
                                        setMobileMenuOpen(false);
                                    }}
                                    className={`w-full flex items-center gap-4 px-4 py-4 rounded-xl transition-colors ${isActive ? 'bg-wood-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                                        }`}
                                >
                                    <item.icon className="w-6 h-6" />
                                    <span className="font-medium text-lg">{item.label}</span>
                                </button>
                            );
                        })}
                    </nav>
                    <div className="p-4 border-t border-slate-700 bg-slate-800">
                        <button
                            onClick={() => navigate('/')}
                            className="w-full flex items-center justify-center gap-3 px-4 py-4 rounded-xl bg-red-900/20 text-red-400 hover:bg-red-900/40 transition-colors font-bold"
                        >
                            <Icons.LogOut className="w-6 h-6" />
                            Sair do Admin
                        </button>
                    </div>
                </div>
            )}

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-8 shadow-sm shrink-0">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileMenuOpen(true)}
                            className="md:hidden text-slate-500 hover:text-slate-700 p-1"
                        >
                            <Icons.Menu className="w-6 h-6" />
                        </button>
                        <h1 className="text-lg md:text-xl font-bold text-slate-800 truncate max-w-[200px] md:max-w-none">
                            {menuItems.find(i => location.pathname === i.path)?.label || 'Painel Administrativo'}
                        </h1>
                    </div>

                    <div className="flex items-center gap-2 md:gap-4">
                        <div className="hidden md:flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-full border border-slate-200">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span className="text-xs font-bold text-slate-600 uppercase">Sistema Online</span>
                        </div>
                        <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-600 font-bold border border-slate-300">
                            A
                        </div>
                    </div>
                </header>
                <main className={`flex-1 overflow-auto bg-slate-50 ${location.pathname === '/admin/builder' ? 'p-0 overflow-hidden' : 'p-4 md:p-8'}`}>
                    <div className={location.pathname === '/admin/builder' ? 'h-full w-full' : 'max-w-6xl mx-auto'}>
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
