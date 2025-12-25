import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Icons } from '../components/Icon';
import { Loader2 } from 'lucide-react';

interface Fabricante {
    id: number;
    nome: string;
    logo_url: string;
    site_oficial: string;
}

interface Colecao {
    id: number;
    nome: string;
}

interface PadraoDetails {
    id: number;
    nome: string;
    codigo: string;
    linha: string;
    categoria: string;
    imagem_url: string;
    cor_base: string;
    tonalidade: string;
    acabamento: string;
    textura: string;
    brilho: string;
    resistencia_umidade: boolean;
    resistencia_cupim: boolean;
    resistencia_bacteria: boolean;
    resistencia_uv: boolean;
    resistencia_riscos: boolean;
    espessuras_disponiveis: number[];
    aplicacoes: string[];
    descricao: string;
    inspiracao: string;
    lancamento: boolean;
    ano_lancamento: number;
    tags: string[];
    fabricante: Fabricante;
    colecao: Colecao;
}

const MdfPatternDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [pattern, setPattern] = useState<PadraoDetails | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (id) {
            fetchPatternDetails(id);
        }
    }, [id]);

    const fetchPatternDetails = async (patternId: string) => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('padroes_mdf')
                .select(`
          *,
          fabricante:fabricantes_mdf(*),
          colecao:colecoes_mdf(*)
        `)
                .eq('id', patternId)
                .single();

            if (error) throw error;
            setPattern(data as PadraoDetails);
        } catch (error) {
            console.error('Erro ao buscar detalhes do padrão:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20 min-h-[50vh]">
                <Loader2 className="w-12 h-12 text-wood-600 animate-spin" />
            </div>
        );
    }

    if (!pattern) {
        return (
            <div className="text-center py-20">
                <h2 className="text-xl text-white font-bold">Padrão não encontrado</h2>
                <button onClick={() => navigate('/catalog')} className="mt-4 text-wood-500 hover:text-wood-400">
                    Voltar ao Catálogo
                </button>
            </div>
        );
    }

    return (
        <div className="animate-fade-in space-y-6">
            {/* Breadcrumb & Header */}
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-4">
                <button onClick={() => navigate('/catalog')} className="hover:text-white pb-0.5 border-b border-transparent hover:border-slate-400 transition-all">Catálogo</button>
                <Icons.ChevronRight className="w-4 h-4" />
                <span className="text-wood-500">{pattern.nome}</span>
            </div>

            <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 shadow-xl">
                <div className="grid grid-cols-1 md:grid-cols-2">
                    {/* Image Section */}
                    <div className="bg-white/5 relative group p-1">
                        <div className="aspect-square md:aspect-auto md:h-full relative overflow-hidden rounded-xl">
                            {pattern.imagem_url ? (
                                <img
                                    src={pattern.imagem_url}
                                    alt={pattern.nome}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement?.classList.add('bg-gradient-to-br', 'from-slate-800', 'to-slate-700');
                                        const fallback = document.createElement('div');
                                        fallback.className = 'absolute inset-0 flex flex-col items-center justify-center text-slate-500';
                                        fallback.innerHTML = '<svg class="w-24 h-24 opacity-20 mb-4" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg><p class="text-sm opacity-50 font-medium">Imagem indisponível</p>';
                                        e.currentTarget.parentElement?.appendChild(fallback);
                                    }}
                                />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-500">
                                    <div className="text-center">
                                        <Icons.Image className="w-20 h-20 mx-auto opacity-20 mb-2" />
                                        <p className="text-sm">Sem imagem</p>
                                    </div>
                                </div>
                            )}

                            {pattern.lancamento && (
                                <div className="absolute top-4 left-4 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg uppercase tracking-wider z-10">
                                    Lançamento {pattern.ano_lancamento}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info Section */}
                    <div className="p-6 md:p-8 space-y-6">
                        <div>
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-wood-500 font-bold uppercase tracking-wider text-sm mb-1">{pattern.fabricante.nome}</p>
                                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">{pattern.nome}</h1>
                                    <p className="text-slate-400 text-lg">{pattern.colecao?.nome} • {pattern.linha}</p>
                                </div>
                                <button className="bg-slate-700 hover:bg-slate-600 p-3 rounded-full text-white transition-colors">
                                    <Icons.Heart className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="prose prose-invert max-w-none">
                            <p className="text-slate-300 leading-relaxed text-lg">
                                {pattern.descricao || "Sem descrição disponível."}
                            </p>
                            {pattern.inspiracao && (
                                <p className="text-sm text-slate-500 italic border-l-2 border-wood-500 pl-4 mt-2">
                                    "{pattern.inspiracao}"
                                </p>
                            )}
                        </div>

                        {/* Specs Grid */}
                        <div className="grid grid-cols-2 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-700/50">
                            <div>
                                <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Acabamento</span>
                                <span className="text-white">{pattern.acabamento || '-'}</span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Textura</span>
                                <span className="text-white">{pattern.textura || '-'}</span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Brilho</span>
                                <span className="text-white">{pattern.brilho || '-'}</span>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 uppercase font-bold block mb-1">Espessuras</span>
                                <div className="flex gap-2 flex-wrap">
                                    {pattern.espessuras_disponiveis?.map(esp => (
                                        <span key={esp} className="bg-slate-700 text-xs px-2 py-0.5 rounded text-slate-200">{esp}mm</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Tecnologias / Resistências */}
                        <div>
                            <span className="text-xs text-slate-500 uppercase font-bold block mb-3">Tecnologias & Resistência</span>
                            <div className="flex flex-wrap gap-3">
                                {pattern.resistencia_umidade && (
                                    <div className="flex items-center gap-2 bg-blue-900/20 text-blue-300 px-3 py-1.5 rounded-lg border border-blue-900/50 text-xs font-bold">
                                        <Icons.Zap className="w-3 h-3" /> Resistente à Umidade
                                    </div>
                                )}
                                {pattern.resistencia_cupim && (
                                    <div className="flex items-center gap-2 bg-amber-900/20 text-amber-300 px-3 py-1.5 rounded-lg border border-amber-900/50 text-xs font-bold">
                                        <Icons.Shield className="w-3 h-3" /> Proteção Anti-Cupim
                                    </div>
                                )}
                                {pattern.resistencia_bacteria && (
                                    <div className="flex items-center gap-2 bg-green-900/20 text-green-300 px-3 py-1.5 rounded-lg border border-green-900/50 text-xs font-bold">
                                        <Icons.Shield className="w-3 h-3" /> Microban (Antibactéria)
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="pt-4 flex flex-col sm:flex-row gap-3">
                            <button className="flex-1 bg-wood-600 hover:bg-wood-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02]">
                                <Icons.Calculator className="w-5 h-5" /> Calcular Uso
                            </button>
                            {pattern.fabricante.site_oficial && (
                                <a
                                    href={pattern.fabricante.site_oficial}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex-1 bg-slate-700 hover:bg-slate-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-colors"
                                >
                                    <Icons.Book className="w-5 h-5" /> Ver Site Oficial
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Aplicações */}
            {pattern.aplicacoes && pattern.aplicacoes.length > 0 && (
                <div className="mt-8">
                    <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                        <Icons.Check className="text-green-500 w-5 h-5" /> Aplicações Recomendadas
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {pattern.aplicacoes.map((app, idx) => (
                            <div key={idx} className="bg-slate-800 p-4 rounded-xl border border-slate-700 text-slate-300 text-center font-medium">
                                {app}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MdfPatternDetails;
