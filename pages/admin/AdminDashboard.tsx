import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Icons } from '../../components/Icon';
import { Loader2, Database, Layout } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { seedDatabase } from '../../services/databaseSeeder';

const AdminDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalPatterns: 0,
        totalBrands: 0,
        totalCollections: 0,
        totalUsers: 0
    });

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const { count: patternsCount } = await supabase.from('padroes_mdf').select('*', { count: 'exact', head: true });
            const { count: brandsCount } = await supabase.from('fabricantes_mdf').select('*', { count: 'exact', head: true });
            const { count: collectionsCount } = await supabase.from('colecoes_mdf').select('*', { count: 'exact', head: true });
            const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

            setStats({
                totalPatterns: patternsCount || 0,
                totalBrands: brandsCount || 0,
                totalCollections: collectionsCount || 0,
                totalUsers: usersCount || 0
            });
        } catch (error) {
            console.error('Error fetching admin stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 text-wood-600 animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Introduction */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h2 className="text-xl font-bold text-slate-800 mb-2">Bem-vindo à Área de Gestão</h2>
                <p className="text-slate-600">
                    Aqui você tem controle total sobre o conteúdo do Marcenaria Pro. Gerencie produtos, clientes e configurações do sistema.
                </p>
            </div>

            {/* Quick Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Padrões MDF"
                    value={stats.totalPatterns}
                    icon={Icons.Book}
                    color="bg-blue-500"
                    trend="+5 novos essa semana"
                />
                <StatCard
                    title="Fabricantes"
                    value={stats.totalBrands}
                    icon={Icons.Building}
                    color="bg-emerald-500"
                />
                <StatCard
                    title="Coleções Ativas"
                    value={stats.totalCollections}
                    icon={Icons.Box}
                    color="bg-amber-500"
                />
                <StatCard
                    title="Usuários"
                    value={stats.totalUsers}
                    icon={Icons.Users}
                    color="bg-purple-500"
                    trend="Estável"
                    onClick={() => navigate('/admin/users')}
                />
            </div>

            {/* Quick Actions */}
            <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Ações Rápidas</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <ActionButton
                        title="Novo Padrão"
                        icon={Icons.Plus}
                        desc="Adicionar novo MDF ao catálogo"
                        color="text-blue-600 bg-blue-50"
                        onClick={() => navigate('/admin/products')}
                    />
                    <ActionButton
                        title="Gerenciar Fabricantes"
                        icon={Icons.Edit}
                        desc="Editar informações de marcas"
                        color="text-emerald-600 bg-emerald-50"
                        onClick={() => navigate('/admin/brands')}
                    />
                    <ActionButton
                        title="Editor de Blocos"
                        icon={Layout}
                        desc="Criar novos blocos CAD"
                        color="text-indigo-600 bg-indigo-50"
                        onClick={() => navigate('/admin/builder')}
                    />
                    <ActionButton
                        title="Restaurar Banco"
                        icon={Database}
                        desc="Re-popular dados padrões (Fix)"
                        color="text-red-600 bg-red-50"
                        onClick={async () => {
                            if (confirm('Isso tentará inserir os dados padrão (Fabricantes, Coleções, MDFs) caso estejam faltando. Continuar?')) {
                                const res = await seedDatabase();
                                alert(res.message);
                                window.location.reload();
                            }
                        }}
                    />
                </div>
            </div>
        </div>
    );
};

const StatCard = ({ title, value, icon: Icon, color, trend, onClick }: any) => (
    <div
        onClick={onClick}
        className={`bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-start justify-between transition-all ${onClick ? 'cursor-pointer hover:shadow-md hover:border-purple-200' : ''}`}
    >
        <div>
            <p className="text-slate-500 text-sm font-bold uppercase mb-1">{title}</p>
            <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
            {trend && <p className="text-xs text-green-600 mt-2 font-medium">{trend}</p>}
        </div>
        <div className={`${color} p-3 rounded-lg text-white`}>
            <Icon className="w-6 h-6" />
        </div>
    </div>
);

const ActionButton = ({ title, desc, icon: Icon, color, onClick }: any) => (
    <button
        onClick={onClick}
        className="text-left bg-white p-6 rounded-xl shadow-sm border border-slate-200 hover:border-slate-300 hover:shadow-md transition-all group"
    >
        <div className={`w-fit p-3 rounded-lg mb-4 ${color}`}>
            <Icon className="w-6 h-6" />
        </div>
        <h4 className="text-lg font-bold text-slate-800 mb-1 group-hover:text-wood-600 transition-colors">{title}</h4>
        <p className="text-sm text-slate-500">{desc}</p>
    </button>
);

export default AdminDashboard;
