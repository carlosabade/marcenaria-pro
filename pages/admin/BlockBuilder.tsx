
import React, { useState, useEffect, useRef } from 'react';
import {
    MousePointer2, Minus, Square, Circle,
    Maximize, ZoomIn, ZoomOut, Trash2, Copy, Save,
    ChevronUp, ChevronDown, Crosshair, Magnet, Hand, CloudUpload
} from 'lucide-react';
import { supabase } from '../../services/supabaseClient';

// --- Types ---
type Tool = 'select' | 'line' | 'rect' | 'circle' | 'hand';
type SnapMode = 'free' | 'horizontal' | 'vertical';

interface Point {
    x: number;
    y: number;
}

interface Element {
    type: 'retangulo' | 'linha' | 'circulo' | 'elipse';
    x?: number;
    y?: number;
    x1?: number;
    y1?: number;
    x2?: number;
    y2?: number;
    width?: number;
    height?: number;
    radius?: number;
    color: string;
    stroke?: boolean;
    fill?: boolean;
    lineWidth?: number;
    dash?: boolean;
    label?: string;
}

const BlockBuilder: React.FC = () => {
    // --- State ---
    // UI State
    const [tool, setTool] = useState<Tool>('select');
    const [snapMode, setSnapMode] = useState<SnapMode>('free');
    const [zoom, setZoom] = useState(1);
    const [mouseCoords, setMouseCoords] = useState({ x: 0, y: 0 });
    const [elements, setElements] = useState<Element[]>([]);
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const [isSnapping, setIsSnapping] = useState(false); // Visual feedback
    const [isSaving, setIsSaving] = useState(false);

    // Form/Properties State
    const [name, setName] = useState('Móvel Personalizado');
    const [category, setCategory] = useState('cozinha');
    const [width, setWidth] = useState(60);
    const [height, setHeight] = useState(85);
    const [depth, setDepth] = useState(60);

    // Line Styles
    const [lineColor, setLineColor] = useState('#000000');
    const [lineWidth, setLineWidth] = useState(2);
    const [isDashed, setIsDashed] = useState(false);

    // Code
    const [blockId, setBlockId] = useState('movel-custom');
    const [generatedCode, setGeneratedCode] = useState('');
    const [showCode, setShowCode] = useState(false);

    // --- Refs (for interaction performance) ---
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const elementsRef = useRef<Element[]>([]);

    // Interaction Refs
    const isDrawing = useRef(false);
    const isPanning = useRef(false);
    const panStart = useRef({ x: 0, y: 0 });
    const startPoint = useRef<Point | null>(null);
    const currentPoint = useRef<Point | null>(null);
    const pan = useRef({ x: 0, y: 0 });

    // Snapping Refs
    const SNAP_THRESHOLD = 15; // pixels
    const snapPoint = useRef<Point | null>(null);

    const scale = 4; // 1cm = 4px

    // --- Sync State & Refs ---
    useEffect(() => {
        elementsRef.current = elements;
        requestAnimationFrame(renderCanvas);
    }, [elements]);

    useEffect(() => {
        requestAnimationFrame(renderCanvas);
    }, [zoom, tool, snapMode, selectedIndex, lineColor, lineWidth, isDashed]);

    // --- Resize Observer ---
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current && canvasRef.current) {
                canvasRef.current.width = containerRef.current.clientWidth;
                canvasRef.current.height = containerRef.current.clientHeight;
                renderCanvas();
            }
        };

        window.addEventListener('resize', handleResize);
        handleResize();

        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // --- Keyboard Shortcuts ---
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            // Tools
            if (e.key.toLowerCase() === 'l') setTool('line');
            if (e.key.toLowerCase() === 'r') setTool('rect');
            if (e.key.toLowerCase() === 'c') setTool('circle');
            if (e.key.toLowerCase() === 'h' && !isDrawing.current) setTool('hand'); // H for Hand if not drawing
            if (e.key === 'Escape') {
                setTool('select');
                isDrawing.current = false;
                startPoint.current = null;
                renderCanvas();
            }
            if (e.key === 'Delete' && selectedIndex !== null) {
                removeElement(selectedIndex);
            }

            // Snap (while drawing)
            if (isDrawing.current) {
                if (e.key.toLowerCase() === 'h') setSnapMode('horizontal');
                if (e.key.toLowerCase() === 'v') setSnapMode('vertical');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedIndex]);

    // --- Helper: Find Nearest Snap Point ---
    const getNearestSnapPoint = (mouseScreenX: number, mouseScreenY: number): Point | null => {
        let nearest: Point | null = null;
        let minDist = SNAP_THRESHOLD; // pixels

        const checkPoint = (px: number, py: number) => {
            // Convert point to screen space for checking distance
            const screenX = (px * zoom) + pan.current.x;
            const screenY = (py * zoom) + pan.current.y;

            const dx = screenX - mouseScreenX;
            const dy = screenY - mouseScreenY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < minDist) {
                minDist = dist;
                nearest = { x: px, y: py };
            }
        };

        // Check all element key points
        elementsRef.current.forEach(elem => {
            if (elem.type === 'linha') {
                checkPoint(elem.x1!, elem.y1!);
                checkPoint(elem.x2!, elem.y2!);
            } else if (elem.type === 'retangulo') {
                checkPoint(elem.x!, elem.y!); // Top-Left
                checkPoint(elem.x! + elem.width!, elem.y!); // Top-Right
                checkPoint(elem.x!, elem.y! + elem.height!); // Bottom-Left
                checkPoint(elem.x! + elem.width!, elem.y! + elem.height!); // Bottom-Right
            }
        });

        // Also check start point if drawing
        if (isDrawing.current && startPoint.current) {
            checkPoint(startPoint.current.x, startPoint.current.y);
        }

        return nearest;
    };

    // --- Render Logic ---
    const formatCm = (val: number) => {
        // Show 1 decimal place, replacing dot with comma
        return (val / scale).toFixed(1).replace('.', ',');
    };

    const renderCanvas = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Grid
        drawGrid(ctx, canvas);

        ctx.save();
        ctx.translate(pan.current.x, pan.current.y);
        ctx.scale(zoom, zoom);

        // Draw Saved Elements
        elementsRef.current.forEach((elem, index) => {
            if (index === selectedIndex) {
                ctx.shadowColor = '#3B82F6';
                ctx.shadowBlur = 10 / zoom;
                ctx.shadowOffsetX = 0;
                ctx.shadowOffsetY = 0;
            } else {
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
            }

            drawElement(ctx, elem);
            drawLabels(ctx, elem); // New: Draw Dimensions

            // Draw selection handles if selected
            if (index === selectedIndex) {
                ctx.shadowColor = 'transparent';
                ctx.shadowBlur = 0;
                // Ideally draw handles here
            }
        });

        // Draw Temp Element
        if (isDrawing.current && startPoint.current && currentPoint.current) {
            drawTempElement(ctx);
        }

        // Draw Snap Point Indicator
        if (snapPoint.current) {
            ctx.fillStyle = '#EF4444'; // Red
            ctx.beginPath();
            ctx.arc(snapPoint.current.x, snapPoint.current.y, 4 / zoom, 0, Math.PI * 2);
            ctx.fill();
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 2 / zoom;
            ctx.stroke();
        }

        ctx.restore();
    };

    const drawGrid = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
        ctx.strokeStyle = '#F0F0F0';
        ctx.lineWidth = 1;
        const gridSize = 50 * zoom;

        const offsetX = pan.current.x % gridSize;
        const offsetY = pan.current.y % gridSize;

        for (let x = offsetX; x < canvas.width; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
            ctx.stroke();
        }
        for (let y = offsetY; y < canvas.height; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
            ctx.stroke();
        }
    };

    const drawElement = (ctx: CanvasRenderingContext2D, elem: Element) => {
        ctx.strokeStyle = elem.color;
        ctx.fillStyle = elem.color;
        ctx.lineWidth = elem.lineWidth || 2;

        if (elem.dash) ctx.setLineDash([5, 5]);
        else ctx.setLineDash([]);

        if (elem.type === 'linha') {
            ctx.beginPath();
            ctx.moveTo(elem.x1!, elem.y1!);
            ctx.lineTo(elem.x2!, elem.y2!);
            ctx.stroke();
        } else if (elem.type === 'retangulo') {
            if (elem.stroke) ctx.strokeRect(elem.x!, elem.y!, elem.width!, elem.height!);
            if (elem.fill) ctx.fillRect(elem.x!, elem.y!, elem.width!, elem.height!);
        } else if (elem.type === 'circulo') {
            ctx.beginPath();
            ctx.arc(elem.x!, elem.y!, elem.radius!, 0, Math.PI * 2);
            if (elem.fill) ctx.fill();
            else ctx.stroke();
        }

        ctx.setLineDash([]);
    };

    const drawLabels = (ctx: CanvasRenderingContext2D, elem: Element) => {
        ctx.fillStyle = '#666';
        ctx.font = `${10 / zoom}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (elem.type === 'linha') {
            const dx = elem.x2! - elem.x1!;
            const dy = elem.y2! - elem.y1!;
            const len = Math.sqrt(dx * dx + dy * dy);
            const midX = (elem.x1! + elem.x2!) / 2;
            const midY = (elem.y1! + elem.y2!) / 2;

            // Draw background box for text
            const text = `${formatCm(len)}cm`;
            ctx.fillText(text, midX, midY - (10 / zoom));
        } else if (elem.type === 'retangulo') {
            const wCm = formatCm(elem.width!);
            const hCm = formatCm(elem.height!);

            // Width label
            ctx.fillText(`${wCm}cm`, elem.x! + elem.width! / 2, elem.y! - (10 / zoom));
            // Height label
            ctx.save();
            ctx.translate(elem.x! - (10 / zoom), elem.y! + elem.height! / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(`${hCm}cm`, 0, 0);
            ctx.restore();
        }
    };

    const drawTempElement = (ctx: CanvasRenderingContext2D) => {
        if (!startPoint.current || !currentPoint.current) return;

        ctx.strokeStyle = lineColor;
        ctx.fillStyle = lineColor;
        ctx.lineWidth = lineWidth;
        if (isDashed) ctx.setLineDash([5, 5]);

        const start = startPoint.current;
        const curr = currentPoint.current;

        if (tool === 'line') {
            ctx.beginPath();
            ctx.moveTo(start.x, start.y);
            ctx.lineTo(curr.x, curr.y);
            ctx.stroke();

            // Draw Temp Length
            const dx = curr.x - start.x;
            const dy = curr.y - start.y;
            const len = Math.sqrt(dx * dx + dy * dy);
            ctx.fillStyle = '#000';
            ctx.font = `${12 / zoom}px sans-serif`;
            ctx.fillText(`${formatCm(len)}cm`, (start.x + curr.x) / 2, (start.y + curr.y) / 2 - 15);

        } else if (tool === 'rect') {
            const w = curr.x - start.x;
            const h = curr.y - start.y;
            ctx.strokeRect(start.x, start.y, w, h);

            ctx.fillStyle = '#000';
            ctx.font = `${12 / zoom}px sans-serif`;
            const wCm = formatCm(Math.abs(w));
            const hCm = formatCm(Math.abs(h));
            ctx.fillText(`${wCm} x ${hCm} cm`, start.x + w / 2, start.y - 15);

        } else if (tool === 'circle') {
            const radius = Math.sqrt(Math.pow(curr.x - start.x, 2) + Math.pow(curr.y - start.y, 2));
            ctx.beginPath();
            ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.setLineDash([]);
    };

    // --- interaction Handlers ---
    const handleMouseMove = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();

        // Mouse in screen space (relative to canvas)
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        // Panning Logic
        if (isPanning.current) {
            const dx = screenX - panStart.current.x;
            const dy = screenY - panStart.current.y;
            pan.current = { x: pan.current.x + dx, y: pan.current.y + dy };
            panStart.current = { x: screenX, y: screenY }; // reset for next move
            renderCanvas();
            return;
        }

        // Mouse in world space
        const worldX = (screenX - pan.current.x) / zoom;
        const worldY = (screenY - pan.current.y) / zoom;

        // Check snapping
        const nearestSnap = getNearestSnapPoint(screenX, screenY);
        snapPoint.current = nearestSnap;
        setIsSnapping(!!nearestSnap);

        // Use scanned point OR raw mouse point
        const activeX = nearestSnap ? nearestSnap.x : worldX;
        const activeY = nearestSnap ? nearestSnap.y : worldY;

        // Update Status Bar
        setMouseCoords({
            x: Number((activeX / scale).toFixed(1)),
            y: Number((activeY / scale).toFixed(1))
        });

        if (!isDrawing.current || !startPoint.current) return;

        let x = activeX;
        let y = activeY;

        // Snap Mode Overrides (H/V keys)
        if (snapMode === 'horizontal') y = startPoint.current.y;
        if (snapMode === 'vertical') x = startPoint.current.x;

        currentPoint.current = { x, y };
        renderCanvas();
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const rect = canvas.getBoundingClientRect();
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;

        if (tool === 'hand') {
            isPanning.current = true;
            panStart.current = { x: screenX, y: screenY };
            return;
        }

        const worldX = (screenX - pan.current.x) / zoom;
        const worldY = (screenY - pan.current.y) / zoom;

        // SELECTION LOGIC
        if (tool === 'select') {
            let foundIndex: number | null = null;
            // Iterate reverse to select top-most
            for (let i = elements.length - 1; i >= 0; i--) {
                const elem = elements[i];
                if (elem.type === 'retangulo') {
                    if (worldX >= elem.x! && worldX <= elem.x! + elem.width! &&
                        worldY >= elem.y! && worldY <= elem.y! + elem.height!) {
                        foundIndex = i;
                        break;
                    }
                } else if (elem.type === 'linha') {
                    // Line hit detection (distance from point to segment)
                    const distCheck = 5 / zoom; // Tolerance
                    const A = { x: elem.x1!, y: elem.y1! };
                    const B = { x: elem.x2!, y: elem.y2! };
                    const P = { x: worldX, y: worldY };

                    const lenSq = Math.pow(B.x - A.x, 2) + Math.pow(B.y - A.y, 2);
                    if (lenSq === 0) continue;

                    let t = ((P.x - A.x) * (B.x - A.x) + (P.y - A.y) * (B.y - A.y)) / lenSq;
                    t = Math.max(0, Math.min(1, t));
                    const proj = { x: A.x + t * (B.x - A.x), y: A.y + t * (B.y - A.y) };
                    const dist = Math.sqrt(Math.pow(P.x - proj.x, 2) + Math.pow(P.y - proj.y, 2));

                    if (dist < distCheck) {
                        foundIndex = i;
                        break;
                    }
                } else if (elem.type === 'circulo') {
                    const dist = Math.sqrt(Math.pow(worldX - elem.x!, 2) + Math.pow(worldY - elem.y!, 2));
                    if (Math.abs(dist - elem.radius!) < 5 / zoom) { // Click on rim
                        foundIndex = i;
                        break;
                    }
                }
            }
            setSelectedIndex(foundIndex);
            return;
        }

        // Apply snap if exists
        const nearestSnap = getNearestSnapPoint(screenX, screenY);
        const startX = nearestSnap ? nearestSnap.x : worldX;
        const startY = nearestSnap ? nearestSnap.y : worldY;

        const coords = { x: startX, y: startY };

        isDrawing.current = true;
        startPoint.current = coords;
        currentPoint.current = coords;
    };

    const handleMouseUp = () => {
        if (isPanning.current) {
            isPanning.current = false;
            return;
        }

        if (!isDrawing.current || !startPoint.current || !currentPoint.current) return;

        // Finish Drawing
        const start = startPoint.current;
        const end = currentPoint.current;

        // Don't add if too small
        const dist = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
        if (dist < 2 && tool !== 'circle') {
            isDrawing.current = false;
            startPoint.current = null;
            renderCanvas();
            return;
        }

        let newElement: Element | null = null;

        if (tool === 'line') {
            newElement = {
                type: 'linha',
                x1: start.x, y1: start.y,
                x2: end.x, y2: end.y,
                color: lineColor,
                lineWidth: lineWidth,
                dash: isDashed,
                label: `Linha`
            };
        } else if (tool === 'rect') {
            const x = Math.min(start.x, end.x);
            const y = Math.min(start.y, end.y);
            const w = Math.abs(end.x - start.x);
            const h = Math.abs(end.y - start.y);
            newElement = {
                type: 'retangulo',
                x, y, width: w, height: h,
                stroke: true, fill: false,
                color: lineColor,
                lineWidth: lineWidth,
                dash: isDashed,
                label: `Retângulo`
            };
        } else if (tool === 'circle') {
            newElement = {
                type: 'circulo',
                x: start.x, y: start.y,
                radius: dist,
                stroke: true, fill: false,
                color: lineColor,
                lineWidth: lineWidth,
                label: `Círculo`
            };
        }

        if (newElement) {
            setElements(prev => [...prev, newElement!]);
        }

        isDrawing.current = false;
        startPoint.current = null;
        currentPoint.current = null;
        renderCanvas();
    };

    // --- Layer & Actions ---
    const removeElement = (index: number) => {
        setElements(prev => prev.filter((_, i) => i !== index));
        setSelectedIndex(null);
    };

    const moveLayer = (index: number, direction: number) => {
        if (index + direction < 0 || index + direction >= elements.length) return;
        const newEls = [...elements];
        [newEls[index], newEls[index + direction]] = [newEls[index + direction], newEls[index]];
        setElements(newEls);
        setSelectedIndex(index + direction);
    };

    const addContorno = () => {
        setElements(prev => [...prev, {
            type: 'retangulo',
            x: 0, y: 0,
            width: width * scale,
            height: height * scale,
            color: '#000000',
            stroke: true, fill: false,
            lineWidth: 2,
            label: `Contorno ${width}x${height}`
        }]);
    };

    const clearAll = () => {
        if (confirm('Limpar tudo?')) {
            setElements([]);
            setSelectedIndex(null);
        }
    };

    // --- Save/Generate Code ---
    const generateCode = () => {
        const toCamelCase = (str: string) => str.replace(/-([a-z])/g, g => g[1].toUpperCase());
        const varName = toCamelCase(blockId);

        let code = `const ${varName} = {\n`;
        code += `    name: '${name}',\n`;
        code += `    width: ${width},\n`;
        code += `    height: ${height},\n`;
        code += `    depth: ${depth},\n`;
        code += `    draw: function(ctx, x, y, scale) {\n`;

        elements.forEach(elem => {
            if (elem.color !== '#000000') {
                code += `        ctx.strokeStyle = '${elem.color}';\n`;
                code += `        ctx.fillStyle = '${elem.color}';\n`;
            }
            if (elem.lineWidth !== 2) code += `        ctx.lineWidth = ${elem.lineWidth};\n`;
            if (elem.dash) code += `        ctx.setLineDash([5, 5]);\n`;

            if (elem.type === 'retangulo') {
                const x = Math.round(elem.x! / scale);
                const y = Math.round(elem.y! / scale);
                const w = Math.round(elem.width! / scale);
                const h = Math.round(elem.height! / scale);
                code += `        ctx.strokeRect(x + ${x}*scale, y + ${y}*scale, ${w}*scale, ${h}*scale);\n`;
            } else if (elem.type === 'linha') {
                const x1 = Math.round(elem.x1! / scale);
                const y1 = Math.round(elem.y1! / scale);
                const x2 = Math.round(elem.x2! / scale);
                const y2 = Math.round(elem.y2! / scale);
                code += `        ctx.beginPath();\n`;
                code += `        ctx.moveTo(x + ${x1}*scale, y + ${y1}*scale);\n`;
                code += `        ctx.lineTo(x + ${x2}*scale, y + ${y2}*scale);\n`;
                code += `        ctx.stroke();\n`;
            } else if (elem.type === 'circulo') {
                const x = Math.round(elem.x! / scale);
                const y = Math.round(elem.y! / scale);
                const r = Math.round(elem.radius! / scale);
                code += `        ctx.beginPath();\n`;
                code += `        ctx.arc(x + ${x}*scale, y + ${y}*scale, ${r}*scale, 0, Math.PI * 2);\n`;
                code += `        ctx.stroke();\n`;
            }
            if (elem.dash) code += `        ctx.setLineDash([]);\n`;
        });

        code += `    }\n};\n`;
        code += `// Copie e cole dentro de AILab.tsx no objeto BLOCK_LIBRARY`;

        setGeneratedCode(code);
        return code;
    };

    const copyCode = () => {
        const code = generateCode();
        navigator.clipboard.writeText(code);
        alert("Código copiado! Agora cole no AILab.tsx");
    };

    const saveToLibrary = async () => {
        if (!name || elements.length === 0) {
            alert("Preencha o nome e adicione elementos antes de salvar.");
            return;
        }

        setIsSaving(true);
        try {
            const { data, error } = await supabase
                .from('custom_blocks')
                .insert([
                    {
                        name: name,
                        category: category,
                        dimensions: { width, height, depth },
                        elements: elements
                    }
                ])
                .select();

            if (error) throw error;

            alert("Bloco salvo com sucesso na biblioteca!");
        } catch (error: any) {
            console.error('Error saving block:', error);
            alert(`Erro ao salvar bloco: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-slate-100 font-sans text-slate-800 overflow-hidden">
            {/* Header */}
            <div className="bg-slate-900 text-white px-6 py-3 flex justify-between items-center shadow-md z-20">
                <div className="flex items-center gap-8">
                    <h1 className="text-lg font-bold flex items-center gap-2">
                        📐 Criador CAD Profissional
                    </h1>

                    {/* Toolbar */}
                    <div className="flex gap-1 bg-white/10 p-1 rounded-lg">
                        <button onClick={() => setTool('select')} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${tool === 'select' ? 'bg-blue-600 text-white shadow' : 'hover:bg-white/10 text-slate-300'}`}>
                            <MousePointer2 className="w-4 h-4" /> Selecionar
                        </button>
                        <button onClick={() => setTool('hand')} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${tool === 'hand' ? 'bg-blue-600 text-white shadow' : 'hover:bg-white/10 text-slate-300'}`}>
                            <Hand className="w-4 h-4" /> Mover
                        </button>
                        <button onClick={() => setTool('line')} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${tool === 'line' ? 'bg-blue-600 text-white shadow' : 'hover:bg-white/10 text-slate-300'}`}>
                            <Minus className="w-4 h-4" /> Linha
                        </button>
                        <button onClick={() => setTool('rect')} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${tool === 'rect' ? 'bg-blue-600 text-white shadow' : 'hover:bg-white/10 text-slate-300'}`}>
                            <Square className="w-4 h-4" /> Retângulo
                        </button>
                        <button onClick={() => setTool('circle')} className={`px-4 py-2 rounded-md flex items-center gap-2 text-sm font-semibold transition-all ${tool === 'circle' ? 'bg-blue-600 text-white shadow' : 'hover:bg-white/10 text-slate-300'}`}>
                            <Circle className="w-4 h-4" /> Círculo
                        </button>
                    </div>
                </div>

                {/* Status Bar */}
                <div className="flex items-center gap-6 text-xs font-mono text-slate-400">
                    <div className="flex items-center gap-2">
                        <span className="opacity-50">FERRAMENTA</span>
                        <span className="text-white font-bold uppercase">{tool}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="opacity-50">IMÃ</span>
                        <span className={`font-bold uppercase flex items-center gap-1 ${isSnapping ? 'text-blue-400' : 'text-slate-500'}`}>
                            {isSnapping ? <Magnet className="w-3 h-3 animate-pulse" /> : <Crosshair className="w-3 h-3" />}
                            {isSnapping ? "ATIVO" : "NADA"}
                        </span>
                    </div>
                    <div className="flex items-center gap-2 bg-black/30 px-3 py-1 rounded">
                        <span className="text-white">{String(mouseCoords.x).replace('.', ',')}, {String(mouseCoords.y).replace('.', ',')} cm</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
                {/* Left Panel: Config */}
                <div className="w-80 bg-white border-r border-slate-200 flex flex-col overflow-y-auto z-10 shadow-lg">
                    <div className="p-4 border-b border-slate-100 bg-slate-50 sticky top-0 font-bold text-slate-700">
                        ⚙️ Configurações
                    </div>

                    <div className="p-5 space-y-6">
                        <section>
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Informações</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Nome</label>
                                    <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full border rounded p-2 text-sm" />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Dimensões (L x A x P)</label>
                                    <div className="grid grid-cols-3 gap-2">
                                        <input type="number" value={width} onChange={e => setWidth(Number(e.target.value))} className="border rounded p-2 text-sm" placeholder="L" />
                                        <input type="number" value={height} onChange={e => setHeight(Number(e.target.value))} className="border rounded p-2 text-sm" placeholder="A" />
                                        <input type="number" value={depth} onChange={e => setDepth(Number(e.target.value))} className="border rounded p-2 text-sm" placeholder="P" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Categoria (Salvar em)</label>
                                    <select value={category} onChange={e => setCategory(e.target.value)} className="w-full border border-slate-300 rounded p-2 text-sm bg-white text-slate-900 shadow-sm">
                                        <option value="cozinha">Cozinha</option>
                                        <option value="dormitorio">Dormitório</option>
                                        <option value="sala">Sala</option>
                                        <option value="banheiro">Banheiro</option>
                                        <option value="mesas">Mesas</option>
                                        <option value="escritorio">Escritório</option>
                                    </select>
                                </div>
                            </div>
                        </section>

                        {/* Selected Item Properties */}
                        {selectedIndex !== null && elements[selectedIndex] && (
                            <section className="bg-blue-50 p-3 rounded border border-blue-100">
                                <h3 className="text-xs font-bold text-blue-900 uppercase tracking-wider mb-3 flex items-center justify-between">
                                    Item Selecionado
                                    <span className="text-[10px] bg-blue-200 px-2 py-0.5 rounded text-blue-800">#{selectedIndex + 1}</span>
                                </h3>

                                {elements[selectedIndex].type === 'retangulo' && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-semibold text-blue-700 mb-1">Largura (cm)</label>
                                                <input
                                                    type="number"
                                                    value={Number((elements[selectedIndex].width! / scale).toFixed(1))}
                                                    step="0.1"
                                                    onChange={e => {
                                                        const newVal = Number(e.target.value) * scale;
                                                        const newEls = [...elements];
                                                        newEls[selectedIndex] = { ...newEls[selectedIndex], width: newVal };
                                                        setElements(newEls);
                                                    }}
                                                    className="w-full border border-blue-200 rounded p-1.5 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-blue-700 mb-1">Altura (cm)</label>
                                                <input
                                                    type="number"
                                                    value={Number((elements[selectedIndex].height! / scale).toFixed(1))}
                                                    step="0.1"
                                                    onChange={e => {
                                                        const newVal = Number(e.target.value) * scale;
                                                        const newEls = [...elements];
                                                        newEls[selectedIndex] = { ...newEls[selectedIndex], height: newVal };
                                                        setElements(newEls);
                                                    }}
                                                    className="w-full border border-blue-200 rounded p-1.5 text-sm"
                                                />
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-semibold text-blue-700 mb-1">Pos X (cm)</label>
                                                <input
                                                    type="number"
                                                    value={Number((elements[selectedIndex].x! / scale).toFixed(1))}
                                                    step="0.1"
                                                    onChange={e => {
                                                        const newVal = Number(e.target.value) * scale;
                                                        const newEls = [...elements];
                                                        newEls[selectedIndex] = { ...newEls[selectedIndex], x: newVal };
                                                        setElements(newEls);
                                                    }}
                                                    className="w-full border border-blue-200 rounded p-1.5 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-blue-700 mb-1">Pos Y (cm)</label>
                                                <input
                                                    type="number"
                                                    value={Number((elements[selectedIndex].y! / scale).toFixed(1))}
                                                    step="0.1"
                                                    onChange={e => {
                                                        const newVal = Number(e.target.value) * scale;
                                                        const newEls = [...elements];
                                                        newEls[selectedIndex] = { ...newEls[selectedIndex], y: newVal };
                                                        setElements(newEls);
                                                    }}
                                                    className="w-full border border-blue-200 rounded p-1.5 text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {elements[selectedIndex].type === 'linha' && (
                                    <div className="space-y-3">
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <label className="block text-xs font-semibold text-blue-700 mb-1">X1 (cm)</label>
                                                <input
                                                    type="number"
                                                    value={Number((elements[selectedIndex].x1! / scale).toFixed(1))}
                                                    step="0.1"
                                                    onChange={e => {
                                                        const newVal = Number(e.target.value) * scale;
                                                        const newEls = [...elements];
                                                        newEls[selectedIndex] = { ...newEls[selectedIndex], x1: newVal };
                                                        setElements(newEls);
                                                    }}
                                                    className="w-full border border-blue-200 rounded p-1.5 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-blue-700 mb-1">Y1 (cm)</label>
                                                <input
                                                    type="number"
                                                    value={Number((elements[selectedIndex].y1! / scale).toFixed(1))}
                                                    step="0.1"
                                                    onChange={e => {
                                                        const newVal = Number(e.target.value) * scale;
                                                        const newEls = [...elements];
                                                        newEls[selectedIndex] = { ...newEls[selectedIndex], y1: newVal };
                                                        setElements(newEls);
                                                    }}
                                                    className="w-full border border-blue-200 rounded p-1.5 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-blue-700 mb-1">X2 (cm)</label>
                                                <input
                                                    type="number"
                                                    value={Number((elements[selectedIndex].x2! / scale).toFixed(1))}
                                                    step="0.1"
                                                    onChange={e => {
                                                        const newVal = Number(e.target.value) * scale;
                                                        const newEls = [...elements];
                                                        newEls[selectedIndex] = { ...newEls[selectedIndex], x2: newVal };
                                                        setElements(newEls);
                                                    }}
                                                    className="w-full border border-blue-200 rounded p-1.5 text-sm"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-semibold text-blue-700 mb-1">Y2 (cm)</label>
                                                <input
                                                    type="number"
                                                    value={Number((elements[selectedIndex].y2! / scale).toFixed(1))}
                                                    step="0.1"
                                                    onChange={e => {
                                                        const newVal = Number(e.target.value) * scale;
                                                        const newEls = [...elements];
                                                        newEls[selectedIndex] = { ...newEls[selectedIndex], y2: newVal };
                                                        setElements(newEls);
                                                    }}
                                                    className="w-full border border-blue-200 rounded p-1.5 text-sm"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                )}
                                <button
                                    onClick={() => removeElement(selectedIndex!)}
                                    className="w-full mt-2 py-2 bg-red-100 text-red-600 rounded flex items-center justify-center gap-2 text-sm font-semibold hover:bg-red-200"
                                >
                                    <Trash2 className="w-4 h-4" /> Excluir Item
                                </button>
                            </section>
                        )}

                        <section>
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Modo de Desenho</h3>
                            <div className="bg-amber-50 border-l-4 border-amber-400 p-3 rounded mb-3">
                                <p className="text-xs text-amber-900 leading-relaxed">
                                    <strong>Imã Automático:</strong><br />
                                    O cursor agora "gruda" nas pontas das linhas e cantos para facilitar a conexão.
                                </p>
                            </div>

                            <div className="flex gap-2">
                                <button onClick={() => setSnapMode('free')} className={`flex-1 py-1.5 text-xs font-bold rounded border ${snapMode === 'free' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-slate-50'}`}>Livre</button>
                                <button onClick={() => setSnapMode('horizontal')} className={`flex-1 py-1.5 text-xs font-bold rounded border ${snapMode === 'horizontal' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-slate-50'}`}>Horiz.</button>
                                <button onClick={() => setSnapMode('vertical')} className={`flex-1 py-1.5 text-xs font-bold rounded border ${snapMode === 'vertical' ? 'bg-blue-600 text-white' : 'bg-white hover:bg-slate-50'}`}>Vert.</button>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">Estilo da Linha</h3>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Cor</label>
                                    <div className="flex gap-2">
                                        <input type="color" value={lineColor} onChange={e => setLineColor(e.target.value)} className="h-9 w-12 p-0 border rounded cursor-pointer" />
                                        <input type="text" value={lineColor} onChange={e => setLineColor(e.target.value)} className="flex-1 border rounded p-2 text-sm font-mono uppercase" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-slate-500 mb-1">Espessura: {lineWidth}px</label>
                                    <input type="range" min="1" max="5" value={lineWidth} onChange={e => setLineWidth(Number(e.target.value))} className="w-full" />
                                </div>
                                <div className="flex items-center gap-2">
                                    <input type="checkbox" id="dashed" checked={isDashed} onChange={e => setIsDashed(e.target.checked)} className="rounded border-slate-300" />
                                    <label htmlFor="dashed" className="text-sm text-slate-700">Linha tracejada</label>
                                </div>
                            </div>
                        </section>

                        <div className="pt-4 border-t border-slate-100 space-y-2">
                            <section className="bg-slate-50 p-2 rounded mb-2 border border-slate-200">
                                <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">Exportar / Salvar</h3>
                                <div className="space-y-2">
                                    <button
                                        onClick={saveToLibrary}
                                        disabled={isSaving}
                                        className="w-full py-2 bg-indigo-600 text-white rounded text-sm font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                                    >
                                        {isSaving ? (
                                            "Salvando..."
                                        ) : (
                                            <><CloudUpload className="w-4 h-4" /> Salvar na Biblioteca</>
                                        )}
                                    </button>

                                    <div className="relative">
                                        <div className="absolute inset-0 flex items-center">
                                            <div className="w-full border-t border-slate-300"></div>
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-slate-50 px-2 text-slate-500">ou copiar código</span>
                                        </div>
                                    </div>

                                    <input
                                        type="text"
                                        value={blockId}
                                        onChange={e => setBlockId(e.target.value)}
                                        placeholder="ID do Bloco (ex: movel-sala)"
                                        className="w-full border rounded p-2 text-sm font-mono text-xs"
                                    />
                                    <button onClick={copyCode} className="w-full py-2 bg-slate-200 text-slate-700 rounded text-sm font-semibold hover:bg-slate-300 transition-colors flex items-center justify-center gap-2">
                                        <Copy className="w-4 h-4" /> Copiar JS
                                    </button>
                                </div>
                            </section>

                            <button onClick={addContorno} className="w-full py-2 bg-slate-800 text-white rounded text-sm font-semibold hover:bg-slate-900 transition-colors">
                                📐 Adicionar Contorno Base
                            </button>
                            <button onClick={clearAll} className="w-full py-2 bg-red-50 text-red-600 border border-red-100 rounded text-sm font-semibold hover:bg-red-100 transition-colors">
                                🗑️ Limpar Tudo
                            </button>
                        </div>
                    </div>
                </div>

                {/* Canvas Area */}
                <div ref={containerRef} className="flex-1 bg-white relative cursor-crosshair overflow-hidden">
                    <canvas
                        ref={canvasRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                    />

                    <div className="absolute bottom-4 right-4 bg-black/70 text-white px-4 py-2 rounded-full text-xs font-medium pointer-events-none backdrop-blur-sm">
                        Espaço: Mover Canvas | Roda do Mouse: Zoom | L: Linha | R: Retângulo
                    </div>
                </div>
            </div>
        </div>
    );
};

export default BlockBuilder;
