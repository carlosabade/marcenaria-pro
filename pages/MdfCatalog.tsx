import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Icons } from '../components/Icon';
import { Loader2 } from 'lucide-react';

// Interfaces based on the new database schema
interface Fabricante {
    id: number;
    nome: string;
    logo_url: string;
    catalogo_url?: string;
}

interface PadraoMDF {
    id: number;
    nome: string;
    codigo: string;
    linha: string;
    categoria: string;
    imagem_url: string;
    cor_base: string;
    fabricante: Fabricante;
    tags: string[];
    lancamento: boolean;
    ano_lancamento: number;
}

const MdfCatalog: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [padroes, setPadroes] = useState<PadraoMDF[]>([]);
    const [fabricantes, setFabricantes] = useState<Fabricante[]>([]);
    const [searchTerm, setSearchTerm] = useState('');

    // Navigation State
    const [viewMode, setViewMode] = useState<'brands' | 'patterns'>('brands');
    const [selectedFabricante, setSelectedFabricante] = useState<Fabricante | null>(null);

    // Filters (Secondary)
    const [selectedCategoria, setSelectedCategoria] = useState<string>('');
    const [showFilters, setShowFilters] = useState(false);

    // Load Data
    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        setLoading(true);
        try {
            // 1. Fetch Fabricantes (Distinct)
            const { data: fabData, error: fabError } = await supabase
                .from('fabricantes_mdf')
                .select('*');

            if (fabError) throw fabError;
            setFabricantes(fabData || []);

            // --- Debug Verification ---


            // --- Fetch Data ---
            // 2. Fetch Patterns (All for now, or could optimize to fetch on demand)
            // For a better UX, we'll fetch all and filter client side for this scale
            // 2. Fetch Patterns (Remove filter to debug visibility)
            const { data: patData, error: patError } = await supabase
                .from('padroes_mdf')
                .select('*');

            if (patError) throw patError;

            // Manual Join with loose equality for ID matching
            const formattedPatterns = (patData || []).map((p: any) => {
                // Try to find manufacturer with loose equality (handle string/number mismatch)
                const fab = fabData?.find(f => f.id == p.fabricante_id);
                return {
                    ...p,
                    fabricante: fab || { id: 0, nome: 'Desconhecido', logo_url: '' }
                };
            });

            console.log('Patterns fetched:', (patData || []).length);
            console.log('Formatted:', formattedPatterns.length);

            setPadroes(formattedPatterns as PadraoMDF[]);

        } catch (error) {
            console.error('Erro ao buscar dados:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleBrandClick = (fab: Fabricante) => {
        setSelectedFabricante(fab);
        setViewMode('patterns');
        setSearchTerm(''); // Reset search when entering a brand
    };

    const handleBackToBrands = () => {
        setViewMode('brands');
        setSelectedFabricante(null);
        setSearchTerm('');
    };

    // Filter Logic
    const getFilteredPadroes = () => {
        let result = padroes;

        // 1. Filter by Brand (if selected)
        if (selectedFabricante) {
            result = result.filter(p => p.fabricante.id === selectedFabricante.id);
        }

        // 2. Filter by Category
        if (selectedCategoria) {
            result = result.filter(p => p.categoria === selectedCategoria);
        }

        // 3. Filter by Search
        if (searchTerm) {
            const lowerTerm = searchTerm.toLowerCase();
            result = result.filter(p =>
                p.nome.toLowerCase().includes(lowerTerm) ||
                p.codigo?.toLowerCase().includes(lowerTerm) ||
                p.linha?.toLowerCase().includes(lowerTerm) ||
                p.tags?.some(tag => tag.toLowerCase().includes(lowerTerm))
            );
        }

        return result;
    };

    const filteredItems = getFilteredPadroes();

    // Determine dynamic brand colors/styles (mock logic for visuals)
    const getBrandStyle = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('guararapes')) return 'from-green-900 to-green-700';
        if (n.includes('arauco')) return 'from-blue-900 to-slate-800';
        if (n.includes('duratex')) return 'from-amber-900 to-amber-800';
        if (n.includes('eucatex')) return 'from-red-900 to-red-800';
        if (n.includes('sudati')) return 'from-yellow-900 to-stone-900'; // Sudati (Gold/Stone)
        if (n.includes('floraplac')) return 'from-emerald-900 to-emerald-700'; // Floraplac (Amazon Green)
        if (n.includes('placas')) return 'from-cyan-900 to-slate-800'; // Placas Brasil (Cyan)
        return 'from-slate-800 to-slate-900';
    };

    // URL Debug Trigger
    const [showDebug, setShowDebug] = useState(false);
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('debug') === 'true') setShowDebug(true);
    }, []);

    return (
        <div className="space-y-6 animate-fade-in">
            {/* HIDDEN DEBUG OVERLAY */}
            {showDebug && (
                <div className="bg-black/90 text-green-400 p-4 rounded mb-4 font-mono text-xs overflow-auto max-h-60 border border-green-900 shadow-2xl z-50 relative">
                    <p className="font-bold border-b border-green-800 mb-2">🕵️‍♂️ DEBUG MODE ACTIVATED</p>
                    <p>Fabricantes encontrados: {fabricantes.length}</p>
                    <p>Padrões encontrados (Total Raw): {padroes.length}</p>
                    <p>Fabricante Selecionado: {selectedFabricante?.nome || 'Nenhum'}</p>
                    <p>---</p>
                    <p>Exemplo Raw [0]:</p>
                    <pre>{JSON.stringify(padroes[0] || 'N/A', null, 2)}</pre>
                </div>
            )}

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Icons.Book className="w-6 h-6 text-wood-500" />
                        Catálogo de Padrões
                    </h2>
                    <p className="text-slate-400">
                        {viewMode === 'brands'
                            ? 'Selecione um fabricante para explorar.'
                            : `Explorando coleção ${selectedFabricante?.nome}`
                        }
                    </p>
                </div>

                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/admin/products')}
                        className="hidden md:flex bg-slate-800 hover:bg-slate-700 text-slate-300 px-4 py-2 rounded-lg font-bold items-center gap-2 transition-colors border border-slate-700 mr-2"
                        title="Ir para Área Administrativa"
                    >
                        <Icons.Settings className="w-4 h-4" /> Gerenciar
                    </button>

                    {viewMode === 'patterns' && (
                        <button
                            onClick={handleBackToBrands}
                            className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors border border-slate-600"
                        >
                            <Icons.Dashboard className="w-4 h-4" /> Ver Marcas
                        </button>
                    )}
                    <button className="bg-wood-600 hover:bg-wood-500 text-white px-4 py-2 rounded-lg font-bold flex items-center gap-2 shadow-lg transition-colors">
                        <Icons.Plus className="w-5 h-5" /> Sugerir Padrão
                    </button>
                    {selectedFabricante?.catalogo_url && (
                        <a
                            href={selectedFabricante.catalogo_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 transition-colors"
                        >
                            <Icons.FileText className="w-5 h-5" /> Catálogo PDF
                        </a>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-12 h-12 text-wood-600 animate-spin" />
                </div>
            ) : (
                <>
                    {/* === BRANDS VIEW === */}
                    {viewMode === 'brands' && (
                        <>
                            {fabricantes.length === 0 ? (
                                <div className="text-center py-20 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                                    <Icons.Building className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                                    <h3 className="text-2xl font-bold text-slate-300">Nenhum fabricante encontrado</h3>
                                    <p className="text-slate-500 max-w-md mx-auto mt-2">
                                        Parece que o banco de dados está vazio. Certifique-se de ter rodado o script SQL no Supabase.
                                    </p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {fabricantes.map(fab => (
                                        <button
                                            key={fab.id}
                                            onClick={() => handleBrandClick(fab)}
                                            className={`relative overflow-hidden rounded-2xl h-48 group text-left transition-all hover:scale-[1.02] hover:shadow-2xl border border-slate-700`}
                                        >
                                            {/* Background Gradient */}
                                            <div className={`absolute inset-0 bg-gradient-to-br ${getBrandStyle(fab.nome)} opacity-80 group-hover:opacity-100 transition-opacity`} />

                                            {/* Content */}
                                            <div className="absolute inset-0 p-6 flex flex-col justify-between z-10">
                                                <div className="bg-white/10 w-fit p-3 rounded-xl backdrop-blur-md">
                                                    <Icons.Building className="w-8 h-8 text-white" />
                                                </div>

                                                <div>
                                                    <h3 className="text-2xl font-bold text-white mb-1 group-hover:translate-x-2 transition-transform">{fab.nome}</h3>
                                                    <p className="text-white/60 text-sm flex items-center gap-2">
                                                        {padroes.filter(p => p.fabricante.id === fab.id).length} padrões <Icons.ChevronRight className="w-4 h-4" />
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Decorative Circle */}
                                            <div className="absolute -bottom-8 -right-8 w-32 h-32 bg-white/5 rounded-full blur-xl group-hover:bg-white/10 transition-colors" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                    {/* === PATTERNS VIEW === */}
                    {viewMode === 'patterns' && (
                        <div className="space-y-6 animate-slide-up">
                            {/* Search & Filters */}
                            <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-xl">
                                <div className="flex flex-col md:flex-row gap-4">
                                    <div className="flex-1 relative">
                                        <Icons.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-500 w-5 h-5" />
                                        <input
                                            type="text"
                                            placeholder={`Buscar em ${selectedFabricante?.nome}...`}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full bg-slate-900 border border-slate-700 text-white pl-10 pr-4 py-3 rounded-lg focus:ring-2 focus:ring-wood-500 focus:border-transparent outline-none"
                                        />
                                    </div>

                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className={`px-4 py-2 rounded-lg border flex items-center gap-2 font-medium transition-colors ${showFilters ? 'bg-wood-900/50 border-wood-500 text-wood-400' : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'}`}
                                    >
                                        <Icons.Filter className="w-5 h-5" /> Filtros
                                    </button>
                                </div>

                                {showFilters && (
                                    <div className="mt-4 pt-4 border-t border-slate-700 grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in">
                                        <div>
                                            <label className="text-xs text-slate-500 font-bold uppercase mb-2 block">Categoria</label>
                                            <select
                                                value={selectedCategoria}
                                                onChange={(e) => setSelectedCategoria(e.target.value)}
                                                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
                                            >
                                                <option value="">Todas</option>
                                                <option value="madeirado">Madeirado</option>
                                                <option value="unicolor">Unicolor</option>
                                                <option value="metalizado">Metalizado</option>
                                                <option value="pedra">Híbrido/Pedra</option>
                                            </select>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Grid Results */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                                {filteredItems.map(padrao => (
                                    <div key={padrao.id} className="bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-wood-500/50 transition-all hover:shadow-xl group">
                                        <div className="relative aspect-[4/3] bg-slate-700 overflow-hidden">
                                            {padrao.imagem_url ? (
                                                <img
                                                    src={padrao.imagem_url}
                                                    alt={padrao.nome}
                                                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                                    onError={(e) => {
                                                        e.currentTarget.style.display = 'none';

                                                        // Fallback Gradient Logic based on cor_base
                                                        const c = padrao.cor_base?.toLowerCase() || '';
                                                        let fromColor = 'from-slate-700';
                                                        let toColor = 'to-slate-600';

                                                        // Wood Tones
                                                        if (c.includes('clara') || c.includes('tauari')) { fromColor = 'from-amber-200'; toColor = 'to-amber-400'; }
                                                        else if (c.includes('mel') || c.includes('freijo') || c.includes('carvalho')) { fromColor = 'from-amber-500'; toColor = 'to-amber-700'; }
                                                        else if (c.includes('escura') || c.includes('tabaco')) { fromColor = 'from-amber-900'; toColor = 'to-black'; }
                                                        else if (c.includes('avermelhada') || c.includes('mogno')) { fromColor = 'from-red-900'; toColor = 'to-amber-900'; }

                                                        // Collors
                                                        else if (c.includes('verde')) { fromColor = 'from-green-700'; toColor = 'to-green-900'; }
                                                        else if (c.includes('azul')) { fromColor = 'from-blue-700'; toColor = 'to-blue-900'; }
                                                        else if (c.includes('vermelho') || c.includes('vinho')) { fromColor = 'from-red-700'; toColor = 'to-red-900'; }
                                                        else if (c.includes('bege') || c.includes('areia')) { fromColor = 'from-amber-100'; toColor = 'to-amber-200'; }
                                                        else if (c.includes('cinza') || c.includes('concreto')) { fromColor = 'from-gray-400'; toColor = 'to-gray-600'; }
                                                        else if (c.includes('grafite') || c.includes('chumbo')) { fromColor = 'from-slate-700'; toColor = 'to-slate-900'; }
                                                        else if (c.includes('preto')) { fromColor = 'from-gray-900'; toColor = 'to-black'; }
                                                        else if (c.includes('branco')) { fromColor = 'from-white'; toColor = 'to-gray-100'; }

                                                        e.currentTarget.parentElement?.classList.remove('bg-slate-700');
                                                        e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', fromColor, toColor);

                                                        // Ensure darker icons for light backgrounds
                                                        if (fromColor.includes('white') || fromColor.includes('amber-100') || fromColor.includes('amber-200')) {
                                                            e.currentTarget.parentElement?.classList.add('text-slate-800');
                                                        } else {
                                                            e.currentTarget.parentElement?.classList.add('text-white/30');
                                                        }

                                                        const fallback = document.createElement('div');
                                                        fallback.className = 'absolute inset-0 flex items-center justify-center';
                                                        // Use current color for icon
                                                        fallback.innerHTML = `<svg class="w-12 h-12 opacity-30" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`;
                                                        e.currentTarget.parentElement?.appendChild(fallback);
                                                    }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-900">
                                                    <Icons.Image className="w-12 h-12 opacity-20" />
                                                </div>
                                            )}

                                            {padrao.lancamento && (
                                                <div className="absolute top-2 left-2 bg-green-500 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg uppercase tracking-wider">
                                                    Lançamento {padrao.ano_lancamento}
                                                </div>
                                            )}

                                            <div className="absolute top-2 right-2">
                                                <button className="bg-black/50 hover:bg-wood-600 text-white p-2 rounded-full backdrop-blur-sm transition-colors">
                                                    <Icons.Heart className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="p-4">
                                            <div className="flex justify-between items-start mb-2">
                                                <div>
                                                    <p className="text-xs text-wood-400 font-bold uppercase tracking-wider mb-1">{padrao.fabricante.nome}</p>
                                                    <h3 className="text-lg font-bold text-white leading-tight">{padrao.nome}</h3>
                                                </div>
                                            </div>

                                            <p className="text-sm text-slate-400 mb-4 line-clamp-2">{padrao.linha} • {padrao.categoria}</p>

                                            <div className="flex gap-2 mt-auto">
                                                <button
                                                    onClick={() => navigate(`/catalog/${padrao.id}`)}
                                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded text-sm font-medium transition-colors"
                                                >
                                                    Detalhes
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {filteredItems.length === 0 && (
                                    <div className="col-span-full text-center py-20 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                                        <Icons.Search className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-slate-300">Nenhum padrão encontrado para {selectedFabricante?.nome}</h3>
                                        <p className="text-slate-500">Tente ajustar seus filtros.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
};

export default MdfCatalog;
