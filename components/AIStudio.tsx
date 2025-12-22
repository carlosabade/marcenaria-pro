import React, { useState, useRef, useEffect } from 'react';
import { Icons } from './Icon';
import { supabase } from '../services/supabaseClient';

const AIStudio: React.FC = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const [prompt, setPrompt] = useState('');
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [brushSize, setBrushSize] = useState(5);
    const [tool, setTool] = useState<'pen' | 'eraser'>('pen');

    // Inicializa canvas
    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        // Setup initial canvas white background
        const ctx = canvas.getContext('2d');
        if (ctx) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        }
    }, []);

    const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
        setIsDrawing(true);
        draw(e);
    };

    const stopDrawing = () => {
        setIsDrawing(false);
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) ctx.beginPath(); // Reset path
        }
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing) return;
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Get coordinates
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
        const x = clientX - rect.left;
        const y = clientY - rect.top;

        ctx.lineWidth = brushSize;
        ctx.lineCap = 'round';
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
        setGeneratedImage(null);
    };

    const handleGenerate = async () => {
        if (!prompt) {
            alert('Por favor, descreva o móvel que você desenhou.');
            return;
        }

        setIsGenerating(true);

        // Simulando delay de API
        setTimeout(() => {
            setIsGenerating(false);
            setGeneratedImage('https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&q=80&w=800'); // Mock image
            alert("✨ Imagem gerada com sucesso! (Modo Simulação)\n\nPara funcionar de verdade, precisamos conectar uma API paga (Replicate/OpenAI) futuramente.");
        }, 3000);

        // TODO: Implementar chamada real para Edge Function -> Replicate API
        /*
        const canvas = canvasRef.current;
        const base64 = canvas.toDataURL('image/png');
        const { data, error } = await supabase.functions.invoke('ai-generate', {
            body: { prompt, image: base64 }
        });
        */
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Icons.Zap className="w-6 h-6 text-purple-500" /> Laboratório de IA <span className="text-xs bg-purple-900 text-purple-200 px-2 py-0.5 rounded-full uppercase">Beta</span>
                    </h2>
                    <p className="text-slate-400">Desenhe um rascunho e a IA transforma em um móvel realista.</p>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-8 h-auto lg:h-[600px]">
                {/* Drawing Area */}
                <div className="flex-1 bg-slate-800 rounded-2xl p-4 border border-slate-700 flex flex-col shadow-xl">
                    <div className="flex justify-between items-center mb-4 bg-slate-900 p-2 rounded-xl">
                        <div className="flex gap-2">
                            <button
                                onClick={() => setTool('pen')}
                                className={`p-2 rounded-lg transition-colors ${tool === 'pen' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
                                title="Lápis"
                            >
                                <Icons.Edit className="w-5 h-5" />
                            </button>
                            <button
                                onClick={() => setTool('eraser')}
                                className={`p-2 rounded-lg transition-colors ${tool === 'eraser' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'}`}
                                title="Borracha"
                            >
                                <Icons.Trash className="w-5 h-5" />
                            </button>
                            <input
                                type="range"
                                min="1"
                                max="20"
                                value={brushSize}
                                onChange={(e) => setBrushSize(parseInt(e.target.value))}
                                className="w-24 accent-purple-500"
                            />
                        </div>
                        <button onClick={clearCanvas} className="text-xs text-red-400 hover:text-red-300 font-bold uppercase tracking-wider">
                            Limpar Tela
                        </button>
                    </div>

                    <div className="flex-1 bg-white rounded-xl overflow-hidden cursor-crosshair relative shadow-inner touch-none">
                        <canvas
                            ref={canvasRef}
                            width={600}
                            height={450}
                            className="w-full h-full object-contain"
                            onMouseDown={startDrawing}
                            onMouseUp={stopDrawing}
                            onMouseMove={draw}
                            onTouchStart={startDrawing}
                            onTouchEnd={stopDrawing}
                            onTouchMove={draw}
                        />
                        {!isDrawing && !generatedImage && (
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-slate-300 pointer-events-none text-center">
                                <Icons.Edit className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p className="text-sm font-bold opacity-50">Desenhe seu móvel aqui</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Controls & Result */}
                <div className="w-full lg:w-1/3 space-y-6 flex flex-col">
                    <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700 shadow-xl">
                        <label className="text-xs font-bold text-slate-400 uppercase mb-2 block">Descreva o Móvel</label>
                        <textarea
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            placeholder="Ex: Um guarda-roupa moderno de madeira escura com portas de correr espelhadas e puxadores dourados..."
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white h-32 resize-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 outline-none transition-all"
                        />

                        <button
                            onClick={handleGenerate}
                            disabled={isGenerating || !prompt}
                            className={`w-full mt-4 py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${isGenerating ? 'bg-slate-700 text-slate-500 cursor-wait' : 'bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white hover:shadow-purple-500/25'}`}
                        >
                            {isGenerating ? (
                                <>
                                    <Icons.Loader className="w-6 h-6 animate-spin" />
                                    Gerando Mágica...
                                </>
                            ) : (
                                <>
                                    <Icons.Zap className="w-6 h-6" />
                                    Gerar Imagem Realista
                                </>
                            )}
                        </button>
                    </div>

                    <div className="flex-1 bg-slate-900 rounded-2xl border-2 border-dashed border-slate-700 flex items-center justify-center relative overflow-hidden group">
                        {generatedImage ? (
                            <>
                                <img src={generatedImage} alt="Resultado IA" className="w-full h-full object-cover animate-fade-in" />
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity gap-4">
                                    <button className="bg-white text-black px-4 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition-transform" onClick={() => window.open(generatedImage)}>
                                        Baixar
                                    </button>
                                    <button className="bg-purple-600 text-white px-4 py-2 rounded-full font-bold shadow-lg hover:scale-105 transition-transform" onClick={() => alert("Função 'Salvar no Projeto' virá em breve!")}>
                                        Salvar no Projeto
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center text-slate-600 p-8">
                                <Icons.Image className="w-16 h-16 mx-auto mb-4 opacity-50" />
                                <p className="text-sm font-medium">Sua imagem realista aparecerá aqui</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AIStudio;
