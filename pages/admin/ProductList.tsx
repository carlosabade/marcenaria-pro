import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Icons } from '../../components/Icon';
import { Loader2, Plus, Edit, Trash, Image as ImageIcon, Save, X, ExternalLink } from 'lucide-react';

interface AdminProduct {
    id: number;
    nome: string;
    fabricante_id: number;
    fabricante?: { nome: string };
    categoria: string;
    imagem_url: string;
    cor_base: string;
    ativo: boolean;
}

interface Fabricante {
    id: number;
    nome: string;
}

const ProductList: React.FC = () => {
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [fabricantes, setFabricantes] = useState<Fabricante[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Edit/Add Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<AdminProduct | null>(null);
    const [formData, setFormData] = useState<Partial<AdminProduct>>({});

    useEffect(() => {
        fetchProducts();
        fetchFabricantes();
    }, []);

    const fetchFabricantes = async () => {
        const { data } = await supabase.from('fabricantes_mdf').select('id, nome').order('nome');
        if (data) setFabricantes(data);
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('padroes_mdf')
                .select(`
                    id, nome, categoria, imagem_url, cor_base, disponivel, fabricante_id,
                    fabricante:fabricantes_mdf(nome)
                `)
                .order('id', { ascending: false });

            if (error) throw error;

            if (data) {
                setProducts(data.map((p: any) => ({
                    id: p.id,
                    nome: p.nome,
                    fabricante_id: p.fabricante_id,
                    fabricante: p.fabricante,
                    categoria: p.categoria,
                    imagem_url: p.imagem_url,
                    cor_base: p.cor_base,
                    ativo: p.disponivel
                })));
            }
        } catch (error) {
            console.error('Error fetching products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (product: AdminProduct) => {
        setEditingProduct(product);
        setFormData(product);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingProduct(null);
        setFormData({
            ativo: true,
            categoria: 'madeirado',
            cor_base: 'Madeira',
            fabricante_id: fabricantes[0]?.id
        });
        setIsModalOpen(true);
    };

    const handleSave = async () => {
        try {
            const payload = {
                nome: formData.nome,
                fabricante_id: formData.fabricante_id,
                categoria: formData.categoria,
                imagem_url: formData.imagem_url,
                cor_base: formData.cor_base,
                disponivel: formData.ativo
            };

            if (editingProduct) {
                const { error } = await supabase.from('padroes_mdf').update(payload).eq('id', editingProduct.id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('padroes_mdf').insert(payload);
                if (error) throw error;
            }

            setIsModalOpen(false);
            fetchProducts();
        } catch (error: any) {
            console.error('Error saving:', error);
            alert(`Erro ao salvar: ${error.message || error}`);
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('Tem certeza que deseja excluir?')) return;
        try {
            await supabase.from('padroes_mdf').delete().eq('id', id);
            fetchProducts();
        } catch (error) {
            console.error(error);
        }
    };

    const handleImageSearch = () => {
        const query = `MDF ${formData.nome} ${fabricantes.find(f => f.id === formData.fabricante_id)?.nome || ''} textura`;
        window.open(`https://www.google.com/search?tbm=isch&q=${encodeURIComponent(query)}`, '_blank');
    };

    const filteredProducts = products.filter(p =>
        p.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.fabricante?.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="flex justify-center p-10"><Loader2 className="animate-spin text-wood-600" /></div>;

    return (
        <div className="space-y-6 animate-fade-in relative">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Catálogo de Padrões</h2>
                    <p className="text-slate-500">Gerencie todos os MDFs, cores e imagens disponíveis.</p>
                </div>
                <button onClick={handleAdd} className="bg-wood-600 hover:bg-wood-700 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-sm transition-colors">
                    <Plus className="w-5 h-5" /> Novo Padrão
                </button>
            </div>

            {/* Warning if empty */}
            {products.length === 0 && (
                <div className="bg-orange-50 border border-orange-200 text-orange-800 p-4 rounded-lg flex items-start gap-3">
                    <Icons.AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                        <p className="font-bold">Catálogo Vazio</p>
                        <p className="text-sm">Use o botão "Restaurar Banco" no Dashboard para carregar os dados iniciais.</p>
                    </div>
                </div>
            )}

            {/* Search */}
            <div className="relative">
                <Icons.Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                    type="text"
                    placeholder="Buscar por nome ou fabricante..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 rounded-lg border border-slate-300 focus:border-wood-500 focus:ring-1 focus:ring-wood-500 outline-none"
                />
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProducts.map(product => (
                    <div key={product.id} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden group hover:border-wood-300 transition-all">
                        <div className="relative h-48 bg-slate-100 flex items-center justify-center overflow-hidden">
                            {product.imagem_url ? (
                                <img
                                    src={product.imagem_url}
                                    alt={product.nome}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        if (e.currentTarget.parentElement) {
                                            const c = product.cor_base?.toLowerCase() || '';
                                            let color = '#e2e8f0';
                                            if (c.includes('verde')) color = '#556b2f';
                                            else if (c.includes('azul')) color = '#2F4F4F';
                                            else if (c.includes('amarelo') || c.includes('mel')) color = '#E3BC9A';
                                            else if (c.includes('vermelho')) color = '#8B0000';
                                            else if (c.includes('bege') || c.includes('areia')) color = '#F5F5DC';
                                            else if (c.includes('cinza') || c.includes('grafite')) color = '#708090';
                                            else if (c.includes('marrom') || c.includes('madeira')) color = '#8B4513';
                                            else if (c.includes('preto')) color = '#222';
                                            else if (c.includes('off')) color = '#FAF0E6';

                                            e.currentTarget.parentElement.style.backgroundColor = color;
                                        }
                                    }}
                                />
                            ) : (
                                <div className="flex flex-col items-center gap-2 text-slate-400">
                                    <ImageIcon className="w-10 h-10 opacity-50" />
                                    <span className="text-xs font-medium">Sem Imagem</span>
                                </div>
                            )}

                            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => handleEdit(product)} className="p-2 bg-white rounded-full shadow hover:text-wood-600 text-slate-500" title="Editar">
                                    <Edit className="w-4 h-4" />
                                </button>
                                <button onClick={() => handleDelete(product.id)} className="p-2 bg-white rounded-full shadow hover:text-red-600 text-slate-500" title="Excluir">
                                    <Trash className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                        <div className="p-4">
                            <p className="text-xs font-bold text-wood-600 uppercase mb-1">{product.fabricante?.nome || 'Genérico'}</p>
                            <h3 className="font-bold text-slate-800">{product.nome}</h3>

                            {/* Using same render logic as before */}
                            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-2">
                                <span className="text-xs text-slate-400">Cor Base:</span>
                                <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 rounded-full border border-slate-200"
                                        style={{
                                            backgroundColor: (() => {
                                                backgroundColor: (() => {
                                                    const c = product.cor_base?.toLowerCase() || '';

                                                    // Wood tones
                                                    if (c.includes('clara') || c.includes('tauari') || c.includes('fagg')) return '#D2B48C'; // Tan
                                                    if (c.includes('mel') || c.includes('freijo') || c.includes('carvalho')) return '#CD853F'; // Peru
                                                    if (c.includes('escura') || c.includes('tabaco') || c.includes('imbuia')) return '#5C4033'; // Dark Brown
                                                    if (c.includes('avermelhada') || c.includes('mogno') || c.includes('cerejeira')) return '#8B4513'; // SaddleBrown

                                                    // Specific Colors
                                                    if (c.includes('verde')) return '#2E8B57'; // SeaGreen
                                                    if (c.includes('azul')) return '#4682B4'; // SteelBlue
                                                    if (c.includes('vermelho') || c.includes('marsala') || c.includes('vinho')) return '#800000'; // Maroon
                                                    if (c.includes('amarelo')) return '#DAA520'; // GoldenRod
                                                    if (c.includes('rosa')) return '#FFB6C1'; // LightPink

                                                    // Neutrals
                                                    if (c.includes('bege') || c.includes('areia') || c.includes('creme')) return '#F5F5DC'; // Beige
                                                    if (c.includes('cinza') || c.includes('concreto') || c.includes('cimento')) return '#A9A9A9'; // DarkGray
                                                    if (c.includes('grafite') || c.includes('chumbo')) return '#696969'; // DimGray
                                                    if (c.includes('preto') || c.includes('carbono')) return '#1a1a1a'; // Almost Black
                                                    if (c.includes('branco')) return '#ffffff'; // White
                                                    if (c.includes('off')) return '#FAF0E6'; // Linen

                                                    return '#e2e8f0'; // Default Slate-200
                                                })()
                                            })()
                                        }}
                                    ></div>
                                    <span className="text-xs font-medium text-slate-600">{product.cor_base || 'N/A'}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <h3 className="text-xl font-bold text-slate-800">
                                {editingProduct ? 'Editar Padrão' : 'Novo Padrão'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500">
                                <X className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome do Padrão</label>
                                <input
                                    className="w-full border border-slate-300 rounded-lg p-3 focus:ring-2 focus:ring-wood-500 outline-none"
                                    value={formData.nome || ''}
                                    onChange={e => setFormData({ ...formData, nome: e.target.value })}
                                    placeholder="Ex: Louro Freijó"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Fabricante</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-lg p-3 bg-white"
                                        value={formData.fabricante_id}
                                        onChange={e => setFormData({ ...formData, fabricante_id: Number(e.target.value) })}
                                    >
                                        <option value="">Selecione...</option>
                                        {fabricantes.map(f => (
                                            <option key={f.id} value={f.id}>{f.nome}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria</label>
                                    <select
                                        className="w-full border border-slate-300 rounded-lg p-3 bg-white"
                                        value={formData.categoria}
                                        onChange={e => setFormData({ ...formData, categoria: e.target.value })}
                                    >
                                        <option value="madeirado">Madeirado</option>
                                        <option value="unicolor">Unicolor</option>
                                        <option value="metalizado">Metalizado</option>
                                        <option value="pedra">Pedra/Híbrido</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cor Base (Texto)</label>
                                <input
                                    className="w-full border border-slate-300 rounded-lg p-3"
                                    value={formData.cor_base || ''}
                                    onChange={e => setFormData({ ...formData, cor_base: e.target.value })}
                                    placeholder="Ex: Marrom, Verde, Azul..."
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">URL da Imagem</label>
                                <div className="flex gap-2">
                                    <input
                                        className="flex-1 border border-slate-300 rounded-lg p-3 text-sm"
                                        value={formData.imagem_url || ''}
                                        onChange={e => setFormData({ ...formData, imagem_url: e.target.value })}
                                        placeholder="https://..."
                                    />
                                    <button
                                        onClick={handleImageSearch}
                                        type="button"
                                        className="bg-blue-50 text-blue-600 px-3 rounded-lg border border-blue-200 hover:bg-blue-100 flex items-center gap-1 font-bold text-xs"
                                        title="Buscar imagens no Google"
                                    >
                                        <Icons.Search className="w-4 h-4" /> Buscar
                                    </button>
                                </div>
                                {formData.imagem_url && (
                                    <div className="mt-2 h-32 bg-slate-100 rounded-lg overflow-hidden border border-slate-200 relative">
                                        <img src={formData.imagem_url} className="w-full h-full object-contain" onError={(e) => e.currentTarget.style.display = 'none'} />
                                    </div>
                                )}
                            </div>

                            <div className="flex items-center gap-2 pt-2">
                                <input
                                    type="checkbox"
                                    id="active"
                                    checked={formData.ativo || false}
                                    onChange={e => setFormData({ ...formData, ativo: e.target.checked })}
                                    className="w-5 h-5 text-wood-600 rounded"
                                />
                                <label htmlFor="active" className="text-slate-700 font-medium select-none">Ativo no Catálogo</label>
                            </div>
                        </div>

                        <div className="p-6 bg-slate-50 flex gap-3 justify-end">
                            <button onClick={() => setIsModalOpen(false)} className="px-6 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-200 transition-colors">
                                Cancelar
                            </button>
                            <button onClick={handleSave} className="px-6 py-3 rounded-xl font-bold bg-wood-600 text-white hover:bg-wood-700 shadow-lg flex items-center gap-2">
                                <Save className="w-5 h-5" /> Salvar Padrão
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductList;
