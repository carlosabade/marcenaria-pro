import React from 'react';
import { Zap, Sparkles, Wand2 } from 'lucide-react';

const AILab: React.FC = () => {
    return (
        <div className="space-y-6 pb-20 md:pb-0">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Zap className="w-6 h-6 text-purple-500" />
                        Laboratório de IA
                        <span className="text-xs bg-purple-900 text-purple-200 px-2 py-0.5 rounded-full uppercase">Beta</span>
                    </h2>
                    <p className="text-slate-400">Transforme rascunhos em móveis realistas com inteligência artificial</p>
                </div>
            </div>

            <div className="grid gap-6">
                {/* Card Principal */}
                <div className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 rounded-2xl p-8 border border-purple-500/30">
                    <div className="text-center">
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-purple-600/20 rounded-full mb-4">
                            <Sparkles className="w-10 h-10 text-purple-400" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-3">Em Breve: Geração de Imagens com IA</h3>
                        <p className="text-slate-300 max-w-2xl mx-auto mb-6">
                            Estamos desenvolvendo uma ferramenta revolucionária que permitirá você desenhar um rascunho simples
                            e transformá-lo em uma imagem fotorrealista de móvel usando inteligência artificial.
                        </p>
                    </div>
                </div>

                {/* Features Grid */}
                <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <div className="w-12 h-12 bg-blue-600/20 rounded-lg flex items-center justify-center mb-4">
                            <Wand2 className="w-6 h-6 text-blue-400" />
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">Desenho Simples</h4>
                        <p className="text-slate-400 text-sm">
                            Faça um rascunho básico do móvel que você imagina, direto no navegador
                        </p>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <div className="w-12 h-12 bg-purple-600/20 rounded-lg flex items-center justify-center mb-4">
                            <Sparkles className="w-6 h-6 text-purple-400" />
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">IA Poderosa</h4>
                        <p className="text-slate-400 text-sm">
                            Nossa IA transforma seu rascunho em uma imagem realista e profissional
                        </p>
                    </div>

                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <div className="w-12 h-12 bg-green-600/20 rounded-lg flex items-center justify-center mb-4">
                            <Zap className="w-6 h-6 text-green-400" />
                        </div>
                        <h4 className="text-lg font-bold text-white mb-2">Integração Direta</h4>
                        <p className="text-slate-400 text-sm">
                            Salve as imagens geradas diretamente nos seus projetos e orçamentos
                        </p>
                    </div>
                </div>

                {/* Status */}
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 border-dashed">
                    <p className="text-center text-slate-400">
                        <span className="inline-block w-2 h-2 bg-yellow-500 rounded-full mr-2 animate-pulse"></span>
                        Funcionalidade em desenvolvimento ativo. Aguarde novidades em breve!
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AILab;
