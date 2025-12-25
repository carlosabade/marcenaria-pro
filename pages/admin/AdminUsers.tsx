import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Icons } from '../../components/Icon';
import { Loader2, Smartphone } from 'lucide-react';
import { UserProfile } from '../../types';

interface AdminUser extends UserProfile {
    status: 'active' | 'blocked';
    last_active: string;
}

const AdminUsers: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [users, setUsers] = useState<AdminUser[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data && data.length > 0) {
                const enrichedUsers = data.map((u: any) => ({
                    id: u.id,
                    name: u.data?.name || 'Usuário Sem Nome',
                    email: u.email || 'No email',
                    plan: u.data?.plan || 'free',
                    downloadCount: u.data?.downloadCount || 0,
                    devices: u.data?.devices || [],
                    status: u.status || 'active',
                    last_active: u.updated_at || new Date().toISOString()
                }));
                setUsers(enrichedUsers);
            } else {
                setUsers([]);
            }
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (userId: string) => {
        const user = users.find(u => u.id === userId);
        if (!user) return;

        const newStatus = user.status === 'active' ? 'blocked' : 'active';

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ status: newStatus })
                .eq('id', userId);

            if (error) throw error;

            setUsers(users.map(u =>
                u.id === userId ? { ...u, status: newStatus } : u
            ));
        } catch (err) {
            console.error('Error updating status:', err);
            alert('Erro ao atualizar status do usuário.');
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-wood-600" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Controle de Usuários</h2>
                    <p className="text-slate-500">Gerencie acessos, licenças e dispositivos conectados.</p>
                </div>
                <div className="relative w-full md:w-64">
                    <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Buscar cliente..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:border-wood-500 focus:ring-1 focus:ring-wood-500 outline-none"
                    />
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Usuário</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Plano</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Sessões Ativas</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredUsers.map(user => (
                                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-wood-100 flex items-center justify-center text-wood-600 font-bold">
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-800">{user.name}</p>
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${user.plan === 'lifetime' ? 'bg-purple-100 text-purple-600' :
                                            user.plan === 'monthly' ? 'bg-blue-100 text-blue-600' :
                                                'bg-slate-100 text-slate-600'
                                            }`}>
                                            {user.plan === 'lifetime' ? 'Vitalício' :
                                                user.plan === 'monthly' ? 'Mensal' : 'Grátis'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            {user.devices && user.devices.length > 0 ? (
                                                user.devices.map(d => (
                                                    <div key={d.id} className="flex items-center gap-1.5 text-xs text-slate-600">
                                                        <Smartphone className="w-3 h-3 text-slate-400" />
                                                        <span>{d.name}</span>
                                                    </div>
                                                ))
                                            ) : (
                                                <span className="text-xs text-slate-400 italic">Nenhum dispositivo</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className={`flex items-center gap-2 text-sm font-medium ${user.status === 'active' ? 'text-green-600' : 'text-red-500'
                                            }`}>
                                            <div className={`w-2 h-2 rounded-full ${user.status === 'active' ? 'bg-green-500' : 'bg-red-500'
                                                }`} />
                                            {user.status === 'active' ? 'Ativo' : 'Bloqueado'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button
                                            onClick={() => toggleStatus(user.id)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${user.status === 'active'
                                                ? 'border-red-200 text-red-600 hover:bg-red-50'
                                                : 'border-green-200 text-green-600 hover:bg-green-50'
                                                }`}
                                        >
                                            {user.status === 'active' ? 'Bloquear' : 'Ativar'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {filteredUsers.length === 0 && (
                    <div className="p-8 text-center text-slate-500">
                        Nenhum usuário encontrado.
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;
