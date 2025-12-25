import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Icons } from '../../components/Icon';
import { Loader2, Plus, Edit, Save, X, ExternalLink } from 'lucide-react';

interface AdminBrand {
    id: number;
    nome: string;
    logo_url: string;
    site_oficial: string;
    catalogo_url: string;
    total_padroes?: number;
}

const AdminBrands: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [brands, setBrands] = useState<AdminBrand[]>([]);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<AdminBrand>>({});

    useEffect(() => {
        fetchBrands();
    }, []);

    const fetchBrands = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('fabricantes_mdf')
                .select('*')
                .order('nome');

            if (error) throw error;
            setBrands(data || []);
        } catch (error) {
            console.error('Error fetching brands:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (brand: AdminBrand) => {
        setEditingId(brand.id);
        setEditForm(brand);
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditForm({});
    };

    const handleSave = async (id: number) => {
        try {
            const { error } = await supabase
                .from('fabricantes_mdf')
                .update({
                    catalogo_url: editForm.catalogo_url,
                    site_oficial: editForm.site_oficial
                })
                .eq('id', id);

            if (error) throw error;

            setBrands(brands.map(b => b.id === id ? { ...b, ...editForm } as AdminBrand : b));
            setEditingId(null);
        } catch (error) {
            console.error('Error updating brand:', error);
            alert('Erro ao salvar alterações.');
        }
    };

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-wood-600" /></div>;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div>
                <h2 className="text-2xl font-bold text-slate-800">Gerenciar Fabricantes</h2>
                <p className="text-slate-500">Configure links de catálogos PDF e sites oficiais das marcas.</p>
            </div>

            {/* List */}
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-bold">
                        <tr>
                            <th className="p-4">Marca</th>
                            <th className="p-4">Site Oficial</th>
                            <th className="p-4">Link Catálogo (PDF)</th>
                            <th className="p-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm text-slate-700">
                        {brands.map(brand => (
                            <tr key={brand.id} className="hover:bg-slate-50 transition-colors">
                                <td className="p-4 font-bold text-slate-800">
                                    {brand.nome}
                                </td>

                                <td className="p-4">
                                    {editingId === brand.id ? (
                                        <input
                                            type="text"
                                            className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                                            value={editForm.site_oficial || ''}
                                            onChange={e => setEditForm({ ...editForm, site_oficial: e.target.value })}
                                            placeholder="https://..."
                                        />
                                    ) : (
                                        brand.site_oficial ? (
                                            <a href={brand.site_oficial} target="_blank" className="flex items-center gap-1 text-blue-600 hover:underline">
                                                Link <ExternalLink className="w-3 h-3" />
                                            </a>
                                        ) : <span className="text-slate-400">-</span>
                                    )}
                                </td>

                                <td className="p-4">
                                    {editingId === brand.id ? (
                                        <input
                                            type="text"
                                            className="w-full border border-slate-300 rounded px-2 py-1 text-xs"
                                            value={editForm.catalogo_url || ''}
                                            onChange={e => setEditForm({ ...editForm, catalogo_url: e.target.value })}
                                            placeholder="Cole o link do PDF aqui..."
                                        />
                                    ) : (
                                        brand.catalogo_url ? (
                                            <a href={brand.catalogo_url} target="_blank" className="flex items-center gap-1 text-green-600 font-bold hover:underline">
                                                <Icons.FileText className="w-3 h-3" /> PDF Ativo
                                            </a>
                                        ) : <span className="text-slate-400 italic">Sem catálogo</span>
                                    )}
                                </td>

                                <td className="p-4 text-right">
                                    {editingId === brand.id ? (
                                        <div className="flex justify-end gap-2">
                                            <button onClick={() => handleSave(brand.id)} className="p-1 text-green-600 hover:bg-green-50 rounded"><Save className="w-4 h-4" /></button>
                                            <button onClick={handleCancel} className="p-1 text-red-600 hover:bg-red-50 rounded"><X className="w-4 h-4" /></button>
                                        </div>
                                    ) : (
                                        <button onClick={() => handleEdit(brand)} className="p-1 text-slate-400 hover:text-wood-600 hover:bg-slate-100 rounded transition-colors">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg text-blue-800 text-sm">
                <p><strong>Dica:</strong> Para o link do PDF, você pode usar links do Google Drive (verifique permissões) ou hospedar o arquivo em um serviço público.</p>
            </div>
        </div>
    );
};

export default AdminBrands;
