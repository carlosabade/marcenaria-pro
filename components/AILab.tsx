import React, { useState, useRef, useEffect } from 'react';
import { Zap, Sparkles, Wand2, Eraser, Pencil, Trash2, Download } from 'lucide-react';

import { generateImageFromSketch } from '../services/geminiService';
import { Icons } from './Icon';

import { getSettings } from '../services/storageService';

const AILab: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [brushSize, setBrushSize] = useState(3);
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');
    const [showCanvas, setShowCanvas] = useState(false);

    // AI State
    const [prompt, setPrompt] = useState('');
    const [generating, setGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const handleGenerate = async () => {
        const settings = getSettings();
        const hasKey = settings.googleApiKey || import.meta.env.VITE_GOOGLE_API_KEY;

        if (!hasKey) {
            setError("Chave de API não encontrada! Configure em Configurações > IA.");
            return;
        }

        if (!prompt) return;
        setGenerating(true);
        setGeneratedImage(null);
        setError(null);

        try {
            const canvas = canvasRef.current;
            const sketch = canvas ? canvas.toDataURL() : '';
            const result = await generateImageFromSketch(sketch, prompt);
            setGeneratedImage(result);
        } catch (err) {
            console.error("Error in AILab:", err);
            setError((err as Error).message);
        } finally {
            setGenerating(false);
        }
    };

    // Inicializa canvas com fundo branco
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }, [showCanvas]);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.beginPath();
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing && e.type !== 'mousedown' && e.type !== 'touchstart') return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Pega coordenadas
        let clientX, clientY;
        if ('touches' in e) {
            const touch = e.touches[0];
            clientX = touch.clientX;
            clientY = touch.clientY;
        } else {
            clientX = (e as React.MouseEvent).clientX;
            clientY = (e as React.MouseEvent).clientY;
        }

        const rect = canvas.getBoundingClientRect();
        const x = (clientX - rect.left) * (canvas.width / rect.width);
        const y = (clientY - rect.top) * (canvas.height / rect.height);

        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.strokeStyle = tool === 'eraser' ? 'white' : 'black';

        ctx.lineTo(x, y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(x, y);
    };

    const clearCanvas = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
            }
        }
    };

    const downloadSketch = () => {
        const canvas = canvasRef.current;
        if (canvas) {
            const link = document.createElement('a');
            link.download = `rascunho-${Date.now()}.png`;
            link.href = canvas.toDataURL();
            link.click();
        }
    };

    if (showCanvas) {
        return (
            <div className="space-y-6 pb-20 md:pb-0">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Zap className="w-6 h-6 text-purple-500" />
                            Laboratório de IA
                            <span className="text-xs bg-purple-900 text-purple-200 px-2 py-0.5 rounded-full uppercase">Beta</span>
                        </h2>
                        <p className="text-slate-400">Desenhe seu móvel e transforme em realidade com IA</p>
                    </div>
                    <button
                        onClick={() => setShowCanvas(false)}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        ← Voltar
                    </button>
                </div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Canvas de Desenho */}
                    <div className="lg:col-span-2 bg-slate-800 rounded-2xl p-4 border border-slate-700">
                        <div className="flex justify-between items-center mb-4 bg-slate-900 p-3 rounded-xl">
                            <div className="flex gap-2 items-center">
                                <button
                                    onClick={() => setTool('pen')}
                                    className={`p-2 rounded-lg transition-all ${tool === 'pen'
                                        ? 'bg-purple-600 text-white shadow-lg'
                                        : 'bg-slate-800 text-slate-400 hover:text-white'
                                        }`}
                                    title="Lápis"
                                >
                                    <Pencil className="w-5 h-5" />
                                </button>
                                <button
                                    onClick={() => setTool('eraser')}
                                    className={`p-2 rounded-lg transition-all ${tool === 'eraser'
                                        ? 'bg-slate-700 text-white shadow-lg'
                                        : 'bg-slate-800 text-slate-400 hover:text-white'
                                        }`}
                                    title="Borracha"
                                >
                                    <Eraser className="w-5 h-5" />
                                </button>
                                <div className="flex items-center gap-2 ml-2">
                                    <span className="text-xs text-slate-400">Espessura:</span>
                                    <input
                                        type="range"
                                        min="1"
                                        max="20"
                                        value={brushSize}
                                        onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                        className="w-24 accent-purple-500"
                                    />
                                    <span className="text-xs text-slate-300 w-6">{brushSize}</span>
                                </div>
                            </div>
                            <button
                                onClick={clearCanvas}
                                className="flex items-center gap-2 px-3 py-2 bg-red-900/20 text-red-400 hover:bg-red-900/30 rounded-lg transition-colors"
                            >
                                <Trash2 className="w-4 h-4" />
                                <span className="text-xs font-bold">Limpar</span>
                            </button>
                        </div>

                        <div className="bg-white rounded-xl overflow-hidden shadow-2xl relative">
                            <canvas
                                ref={canvasRef}
                                width={800}
                                height={600}
                                className="w-full h-auto cursor-crosshair touch-none"
                                onMouseDown={startDrawing}
                                onMouseUp={stopDrawing}
                                onMouseMove={draw}
                                onMouseLeave={stopDrawing}
                                onTouchStart={startDrawing}
                                onTouchEnd={stopDrawing}
                                onTouchMove={draw}
                            />
                            {!isDrawing && (
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-center opacity-30">
                                    <Pencil className="w-12 h-12 mx-auto mb-2" />
                                    <p className="text-sm font-bold">Desenhe seu móvel aqui</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Painel Lateral */}
                    <div className="space-y-4">
                        <div className="bg-slate-800 rounded-2xl p-6 border border-slate-700">
                            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                <Sparkles className="w-5 h-5 text-purple-400" />
                                Ações & IA
                            </h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Descreva o Móvel</label>
                                    <textarea
                                        value={prompt}
                                        onChange={e => setPrompt(e.target.value)}
                                        placeholder="Ex: Armário de cozinha moderno, mdf branco, puxadores dourados..."
                                        className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-sm text-white h-24 resize-none mb-2 focus:border-purple-500 outline-none"
                                    />
                                </div>

                                <button
                                    onClick={downloadSketch}
                                    className="w-full flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-3 rounded-xl font-bold transition-all text-sm"
                                >
                                    <Download className="w-4 h-4" />
                                    Baixar Rascunho
                                </button>

                                <button
                                    onClick={handleGenerate}
                                    disabled={generating || !prompt.trim()}
                                    className={`w-full flex items-center justify-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white py-3 rounded-xl font-bold transition-all shadow-lg hover:shadow-purple-500/25 ${generating || !prompt.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                                >
                                    {generating ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <Wand2 className="w-5 h-5" />
                                    )}
                                    {generating ? 'Criando...' : 'Gerar Imagem Realista'}
                                </button>

                                {error && (
                                    <div className="mt-4 p-3 bg-red-900/50 border border-red-500/50 rounded-xl text-xs text-red-200 animate-fade-in">
                                        <p className="font-bold mb-1 flex items-center gap-2">
                                            <Icons.AlertTriangle className="w-4 h-4" /> Erro na Geração
                                        </p>
                                        {error}
                                    </div>
                                )}

                                {generatedImage && (
                                    <div className="mt-4 animate-fade-in">
                                        <p className="text-xs font-bold text-green-400 mb-2 flex items-center gap-1">
                                            <Icons.Check className="w-3 h-3" /> Imagem Gerada!
                                        </p>
                                        <div className="relative group rounded-xl overflow-hidden border-2 border-purple-500/50">
                                            <img src={generatedImage} className="w-full h-auto" />
                                            <a href={generatedImage} download="ia-generated.png" className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white font-bold transition-opacity">
                                                <Download className="w-6 h-6" />
                                            </a>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 border-dashed">
                            <h4 className="text-sm font-bold text-white mb-2">💡 Dicas</h4>
                            <ul className="text-xs text-slate-400 space-y-1">
                                <li>• Desenhe as formas básicas do móvel</li>
                                <li>• Use linhas simples e claras</li>
                                <li>• Não precisa ser perfeito!</li>
                                <li>• Funciona com mouse ou touch</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Tela inicial
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
                        <h3 className="text-2xl font-bold text-white mb-3">Desenhe e Crie com IA</h3>
                        <p className="text-slate-300 max-w-2xl mx-auto mb-6">
                            Faça um rascunho simples do móvel que você imagina e, em breve, nossa IA transformará
                            em uma imagem fotorrealista profissional.
                        </p>
                        <button
                            onClick={() => setShowCanvas(true)}
                            className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white px-8 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-purple-500/25 transition-all"
                        >
                            <Pencil className="w-6 h-6" />
                            Começar a Desenhar
                        </button>
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
                        <span className="inline-block w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                        Canvas de desenho disponível! Geração com IA em desenvolvimento.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AILab;
