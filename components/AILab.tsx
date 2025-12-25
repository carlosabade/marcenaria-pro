
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { generateImageFromSketch } from '../services/geminiService';

import { getSettings } from '../services/storageService';
import { Wand2, Download, Save, ZoomIn, ZoomOut, Move, MousePointer2, Ruler, Square, Type, Database, Layout, ChevronDown, ChevronRight } from 'lucide-react';
import { supabase } from '../services/supabaseClient';

// ============================================
// TYPES & LIBRARY
// ============================================

interface BlockDefinition {
    name: string;
    width: number;
    height: number;
    depth: number;
    draw: (ctx: CanvasRenderingContext2D, x: number, y: number, scale: number) => void;
}

interface BlockLibrary {
    [category: string]: {
        name: string;
        blocks: { [key: string]: BlockDefinition };
    };
}

interface PlacedBlock {
    id: string;
    category: string;
    type: string;
    x: number;
    y: number;
    selected: boolean;
}

const STATIC_BLOCK_LIBRARY: BlockLibrary = {
    cozinha: {
        name: 'Cozinha',
        blocks: {
            'gabinete-40': {
                name: 'Gabinete Base 40cm',
                width: 40,
                height: 85,
                depth: 60,
                draw: function (ctx, x, y, scale) {
                    const w = this.width * scale;
                    const h = this.height * scale;
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, w, h);
                    ctx.strokeRect(x + 5 * scale, y + 5 * scale, w - 10 * scale, h - 10 * scale);
                    ctx.beginPath();
                    ctx.arc(x + w - 10 * scale, y + h / 2, 3 * scale, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.moveTo(x, y + h / 2);
                    ctx.lineTo(x + w, y + h / 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            },
            'gabinete-60': {
                name: 'Gabinete Base 60cm',
                width: 60,
                height: 85,
                depth: 60,
                draw: function (ctx, x, y, scale) {
                    const w = this.width * scale;
                    const h = this.height * scale;
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, w, h);
                    ctx.strokeRect(x + 5 * scale, y + 5 * scale, w - 10 * scale, h - 10 * scale);
                    ctx.beginPath();
                    ctx.arc(x + w - 10 * scale, y + h / 2, 3 * scale, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.moveTo(x, y + h / 2);
                    ctx.lineTo(x + w, y + h / 2);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            },
            'superior-80': {
                name: 'Armário Superior 80cm',
                width: 80,
                height: 70,
                depth: 35,
                draw: function (ctx, x, y, scale) {
                    const w = this.width * scale;
                    const h = this.height * scale;
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, w, h);
                    const doorWidth = (w - 10 * scale) / 2;
                    ctx.strokeRect(x + 5 * scale, y + 5 * scale, doorWidth, h - 10 * scale);
                    ctx.strokeRect(x + 5 * scale + doorWidth, y + 5 * scale, doorWidth, h - 10 * scale);
                    ctx.fillStyle = '#000';
                    ctx.beginPath();
                    ctx.arc(x + doorWidth - 5 * scale, y + h / 2, 2 * scale, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(x + w - doorWidth + 15 * scale, y + h / 2, 2 * scale, 0, Math.PI * 2);
                    ctx.fill();
                }
            },
            'torre-quente': {
                name: 'Torre Quente',
                width: 60,
                height: 210,
                depth: 60,
                draw: function (ctx, x, y, scale) {
                    const w = this.width * scale;
                    const h = this.height * scale;
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, w, h);
                    const fornoH = 60 * scale;
                    const fornoY = y + h - fornoH - 5 * scale;
                    ctx.strokeRect(x + 5 * scale, fornoY, w - 10 * scale, fornoH);
                    ctx.fillStyle = '#EEE';
                    ctx.fillRect(x + 10 * scale, fornoY + 5 * scale, w - 20 * scale, fornoH - 10 * scale);
                    const microH = 45 * scale;
                    const microY = fornoY - microH - 10 * scale;
                    ctx.strokeRect(x + 5 * scale, microY, w - 10 * scale, microH);
                    ctx.fillStyle = '#EEE';
                    ctx.fillRect(x + 10 * scale, microY + 5 * scale, w - 20 * scale, microH - 10 * scale);
                    const gavY1 = y + 5 * scale;
                    const gavH = 20 * scale;
                    ctx.strokeRect(x + 5 * scale, gavY1, w - 10 * scale, gavH);
                    ctx.strokeRect(x + 5 * scale, gavY1 + gavH + 5 * scale, w - 10 * scale, gavH);
                }
            },
            'balcao-linear-180': {
                name: 'Balcão Linear 180cm',
                width: 180,
                height: 85,
                depth: 60,
                draw: function (ctx, x, y, scale) {
                    const w = this.width * scale;
                    const h = this.height * scale;
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, w, h);
                    const gabW = w / 3;
                    ctx.beginPath();
                    ctx.moveTo(x + gabW, y);
                    ctx.lineTo(x + gabW, y + h);
                    ctx.moveTo(x + 2 * gabW, y);
                    ctx.lineTo(x + 2 * gabW, y + h);
                    ctx.stroke();
                    for (let i = 0; i < 3; i++) {
                        const px = x + (i * gabW) + 5 * scale;
                        ctx.strokeRect(px, y + 5 * scale, gabW - 10 * scale, h - 10 * scale);
                        ctx.beginPath();
                        ctx.arc(px + gabW - 15 * scale, y + h / 2, 3 * scale, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.lineWidth = 4;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + w, y);
                    ctx.stroke();
                }
            },
            'balcao-l': {
                name: 'Balcão em L',
                width: 240,
                height: 180,
                depth: 60,
                draw: function (ctx, x, y, scale) {
                    const w1 = 180 * scale;
                    const w2 = 60 * scale;
                    const h = 85 * scale;
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, w1, h);
                    ctx.strokeRect(x + w1 - w2, y, w2, 180 * scale);
                    ctx.beginPath();
                    ctx.moveTo(x + w1 - w2, y);
                    ctx.lineTo(x + w1, y);
                    ctx.lineTo(x + w1, y + w2);
                    ctx.closePath();
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.ellipse(x + w1 - 30 * scale, y + 30 * scale, 20 * scale, 15 * scale, 0, 0, Math.PI * 2);
                    ctx.stroke();
                }
            },
            'armario-vidro': {
                name: 'Armário Aéreo com Vidro',
                width: 100,
                height: 70,
                depth: 35,
                draw: function (ctx, x, y, scale) {
                    const w = this.width * scale;
                    const h = this.height * scale;
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, w, h);
                    const portaW = (w - 10 * scale) / 2;
                    ctx.strokeRect(x + 5 * scale, y + 5 * scale, portaW, h - 10 * scale);
                    ctx.strokeStyle = '#4A90E2';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x + 5 * scale + portaW / 2, y + 5 * scale);
                    ctx.lineTo(x + 5 * scale + portaW / 2, y + h - 5 * scale);
                    ctx.moveTo(x + 5 * scale, y + h / 2);
                    ctx.lineTo(x + 5 * scale + portaW, y + h / 2);
                    ctx.stroke();
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x + 10 * scale + portaW, y + 5 * scale, portaW, h - 10 * scale);
                    ctx.fillStyle = '#000';
                    ctx.beginPath();
                    ctx.arc(x + 5 * scale + portaW - 10 * scale, y + h / 2, 2 * scale, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(x + 10 * scale + portaW + 10 * scale, y + h / 2, 2 * scale, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    },
    dormitorio: {
        name: 'Dormitório',
        blocks: {
            'gr-2-portas': {
                name: 'Guarda-Roupa 2P',
                width: 120,
                height: 240,
                depth: 60,
                draw: function (ctx, x, y, scale) {
                    const w = this.width * scale;
                    const h = this.height * scale;
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, w, h);
                    const doorW = (w - 10 * scale) / 2;
                    ctx.strokeRect(x + 5 * scale, y + 5 * scale, doorW, h - 10 * scale);
                    ctx.strokeRect(x + 5 * scale + doorW, y + 5 * scale, doorW, h - 10 * scale);
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.moveTo(x + w / 2, y);
                    ctx.lineTo(x + w / 2, y + h);
                    ctx.stroke();
                    for (let i = 1; i <= 3; i++) {
                        ctx.beginPath();
                        ctx.moveTo(x, y + (h / 4) * i);
                        ctx.lineTo(x + w / 2, y + (h / 4) * i);
                        ctx.stroke();
                    }
                    ctx.setLineDash([]);
                    ctx.fillStyle = '#000';
                    ctx.beginPath();
                    ctx.arc(x + doorW - 10 * scale, y + h / 2, 3 * scale, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(x + w - doorW + 20 * scale, y + h / 2, 3 * scale, 0, Math.PI * 2);
                    ctx.fill();
                }
            },
            'gr-3-portas': {
                name: 'Guarda-Roupa 3 Portas',
                width: 180,
                height: 240,
                depth: 60,
                draw: function (ctx, x, y, scale) {
                    const w = this.width * scale;
                    const h = this.height * scale;
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, w, h);
                    const portaW = (w - 20 * scale) / 3;
                    for (let i = 0; i < 3; i++) {
                        const px = x + 5 * scale + (i * (portaW + 5 * scale));
                        ctx.strokeRect(px, y + 5 * scale, portaW, h - 10 * scale);
                        ctx.fillStyle = '#000';
                        ctx.beginPath();
                        ctx.arc(px + portaW - 10 * scale, y + h / 2, 3 * scale, 0, Math.PI * 2);
                        ctx.fill();
                    }
                    ctx.setLineDash([5, 5]);
                    ctx.beginPath();
                    ctx.moveTo(x + w / 3, y);
                    ctx.lineTo(x + w / 3, y + h);
                    ctx.moveTo(x + 2 * w / 3, y);
                    ctx.lineTo(x + 2 * w / 3, y + h);
                    ctx.stroke();
                    for (let i = 0; i < 3; i++) {
                        ctx.beginPath();
                        ctx.moveTo(x, y + h - (i + 1) * 30 * scale);
                        ctx.lineTo(x + w / 3, y + h - (i + 1) * 30 * scale);
                        ctx.stroke();
                    }
                    ctx.setLineDash([]);
                }
            },
            'gr-correr': {
                name: 'Guarda-Roupa Porta Correr',
                width: 240,
                height: 240,
                depth: 60,
                draw: function (ctx, x, y, scale) {
                    const w = this.width * scale;
                    const h = this.height * scale;
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, w, h);
                    const portaW = w / 2;
                    ctx.strokeStyle = '#666';
                    ctx.strokeRect(x + 5 * scale, y + 5 * scale, portaW, h - 10 * scale);
                    ctx.strokeRect(x + w - portaW - 5 * scale, y + 5 * scale, portaW, h - 10 * scale);
                    ctx.strokeStyle = '#000';
                    ctx.strokeRect(x + portaW / 2, y + 5 * scale, portaW, h - 10 * scale);
                    ctx.strokeRect(x + w - portaW / 2 - portaW, y + 5 * scale, portaW, h - 10 * scale);
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + w, y);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(x, y + h);
                    ctx.lineTo(x + w, y + h);
                    ctx.stroke();
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x + portaW / 2 + 10 * scale, y + h / 2 - 20 * scale, 5 * scale, 40 * scale);
                    ctx.strokeRect(x + w - portaW / 2 - portaW + 10 * scale, y + h / 2 - 20 * scale, 5 * scale, 40 * scale);
                }
            },
            'criado-mudo': {
                name: 'Criado-Mudo',
                width: 50,
                height: 60,
                depth: 40,
                draw: function (ctx, x, y, scale) {
                    const w = this.width * scale;
                    const h = this.height * scale;
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, w, h);
                    const gavH = (h - 15 * scale) / 2;
                    ctx.strokeRect(x + 5 * scale, y + 5 * scale, w - 10 * scale, gavH);
                    ctx.strokeRect(x + 5 * scale, y + 10 * scale + gavH, w - 10 * scale, gavH);
                    ctx.fillStyle = '#000';
                    ctx.fillRect(x + w / 2 - 10 * scale, y + gavH / 2, 20 * scale, 3 * scale);
                    ctx.fillRect(x + w / 2 - 10 * scale, y + gavH + 10 * scale + gavH / 2, 20 * scale, 3 * scale);
                }
            }
        }
    },
    sala: {
        name: 'Sala',
        blocks: {
            'painel-tv': {
                name: 'Painel TV 220cm',
                width: 220,
                height: 180,
                depth: 30,
                draw: function (ctx, x, y, scale) {
                    const w = this.width * scale;
                    const h = this.height * scale;
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, w, h);
                    const tvW = 100 * scale;
                    const tvH = 60 * scale;
                    const tvX = x + (w - tvW) / 2;
                    const tvY = y + 30 * scale;
                    ctx.fillStyle = '#333';
                    ctx.fillRect(tvX, tvY, tvW, tvH);
                    const rackH = 50 * scale;
                    const rackY = y + h - rackH - 10 * scale;
                    ctx.strokeRect(x + 10 * scale, rackY, w - 20 * scale, rackH);
                }
            },
            'painel-ripado': {
                name: 'Painel Ripado',
                width: 180,
                height: 240,
                depth: 5,
                draw: function (ctx, x, y, scale) {
                    const w = this.width * scale;
                    const h = this.height * scale;
                    const ripaW = 7 * scale;
                    const espaco = 5 * scale;
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, w, h);
                    let currentX = x + 5 * scale;
                    while (currentX + ripaW < x + w - 5 * scale) {
                        ctx.fillStyle = '#4A7C2A';
                        ctx.fillRect(currentX, y + 5 * scale, ripaW, h - 10 * scale);
                        ctx.strokeStyle = '#2D5016';
                        ctx.strokeRect(currentX, y + 5 * scale, ripaW, h - 10 * scale);
                        currentX += ripaW + espaco;
                    }
                }
            },
            'rack-painel': {
                name: 'Rack com Painel TV',
                width: 200,
                height: 200,
                depth: 40,
                draw: function (ctx, x, y, scale) {
                    const w = this.width * scale;
                    const rackH = 50 * scale;
                    const painelH = 150 * scale;
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, w, painelH);
                    const tvW = 100 * scale;
                    const tvH = 60 * scale;
                    const tvX = x + (w - tvW) / 2;
                    const tvY = y + (painelH - tvH) / 2;
                    ctx.fillStyle = '#222';
                    ctx.fillRect(tvX, tvY, tvW, tvH);
                    ctx.strokeRect(tvX, tvY, tvW, tvH);
                    const nichoW = 35 * scale;
                    const nichoH = 35 * scale;
                    ctx.strokeRect(x + 10 * scale, y + 20 * scale, nichoW, nichoH);
                    ctx.strokeRect(x + 10 * scale, y + painelH - nichoH - 20 * scale, nichoW, nichoH);
                    ctx.strokeRect(x + w - nichoW - 10 * scale, y + 20 * scale, nichoW, nichoH);
                    ctx.strokeRect(x + w - nichoW - 10 * scale, y + painelH - nichoH - 20 * scale, nichoW, nichoH);
                    const rackY = y + painelH;
                    ctx.strokeRect(x, rackY, w, rackH);
                    const compW = (w - 20 * scale) / 3;
                    ctx.strokeRect(x + 5 * scale, rackY + 5 * scale, compW, rackH - 10 * scale);
                    ctx.strokeRect(x + 10 * scale + compW, rackY + 5 * scale, compW, rackH - 10 * scale);
                    ctx.strokeRect(x + 15 * scale + 2 * compW, rackY + 5 * scale, compW, rackH - 10 * scale);
                }
            },
            'nicho-modular': {
                name: 'Nicho Modular',
                width: 80,
                height: 80,
                depth: 25,
                draw: function (ctx, x, y, scale) {
                    const w = this.width * scale;
                    const h = this.height * scale;
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, w, h);
                    ctx.beginPath();
                    ctx.moveTo(x + w / 2, y);
                    ctx.lineTo(x + w / 2, y + h);
                    ctx.stroke();
                    ctx.beginPath();
                    ctx.moveTo(x, y + h / 2);
                    ctx.lineTo(x + w, y + h / 2);
                    ctx.stroke();
                    ctx.strokeStyle = '#999';
                    ctx.setLineDash([3, 3]);
                    const profund = 8 * scale;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + profund, y + profund);
                    ctx.moveTo(x + w, y);
                    ctx.lineTo(x + w - profund, y + profund);
                    ctx.moveTo(x, y + h);
                    ctx.lineTo(x + profund, y + h - profund);
                    ctx.moveTo(x + w, y + h);
                    ctx.lineTo(x + w - profund, y + h - profund);
                    ctx.stroke();
                    ctx.setLineDash([]);
                }
            },
            'prateleira-suspensa': {
                name: 'Prateleira Suspensa',
                width: 100,
                height: 25,
                depth: 25,
                draw: function (ctx, x, y, scale) {
                    const w = this.width * scale;
                    const h = this.height * scale;
                    const d = this.depth * scale;
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.fillStyle = '#8B6914';
                    ctx.fillRect(x, y, w, h);
                    ctx.strokeRect(x, y, w, h);
                    ctx.strokeStyle = '#666';
                    ctx.setLineDash([3, 3]);
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x + d / 2, y - d / 2);
                    ctx.lineTo(x + w + d / 2, y - d / 2);
                    ctx.lineTo(x + w, y);
                    ctx.stroke();
                    ctx.setLineDash([]);
                    ctx.fillStyle = '#333';
                    ctx.beginPath();
                    ctx.arc(x + 10 * scale, y + h / 2, 2 * scale, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.beginPath();
                    ctx.arc(x + w - 10 * scale, y + h / 2, 2 * scale, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }
    },
    banheiro: {
        name: 'Banheiro',
        blocks: {
            'gabinete-pia-80': {
                name: 'Gabinete Pia',
                width: 80,
                height: 60,
                depth: 45,
                draw: function (ctx, x, y, scale) {
                    const w = this.width * scale;
                    const h = this.height * scale;
                    ctx.strokeRect(x, y, w, h);
                    ctx.fillText('Gabinete Pia', x + 5, y + 20);
                }
            }
        }
    },
    mesas: {
        name: 'Mesas',
        blocks: {
            'mesa-jantar': {
                name: 'Mesa de Jantar',
                width: 180,
                height: 90,
                depth: 75,
                draw: function (ctx, x, y, scale) {
                    const w = this.width * scale;
                    const h = this.height * scale;
                    ctx.strokeStyle = '#000';
                    ctx.lineWidth = 2;
                    ctx.strokeRect(x, y, w, h);
                    const pernaW = 8 * scale;
                    ctx.setLineDash([5, 5]);
                    ctx.fillStyle = '#666';
                    ctx.fillRect(x + 5 * scale, y + 5 * scale, pernaW, pernaW);
                    ctx.fillRect(x + w - 5 * scale - pernaW, y + 5 * scale, pernaW, pernaW);
                    ctx.fillRect(x + 5 * scale, y + h - 5 * scale - pernaW, pernaW, pernaW);
                    ctx.fillRect(x + w - 5 * scale - pernaW, y + h - 5 * scale - pernaW, pernaW, pernaW);
                    ctx.setLineDash([]);
                }
            }
        }
    }
};

const AILab: React.FC = () => {
    // --- State ---
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [placedBlocks, setPlacedBlocks] = useState<PlacedBlock[]>([]);
    const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

    // Dynamic Library
    const [blockLibrary, setBlockLibrary] = useState<BlockLibrary>(STATIC_BLOCK_LIBRARY);
    const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);

    // Viewport
    const [zoom, setZoom] = useState(1);
    const [pan, setPan] = useState({ x: 0, y: 0 });
    const [scale] = useState(2); // 1cm = 2px default scale factor

    // Tools
    const [activeTool, setActiveTool] = useState<'select' | 'pan'>('select');
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [lastPan, setLastPan] = useState({ x: 0, y: 0 }); // Snapshot for pan logic

    // AI
    const [generating, setGenerating] = useState(false);
    const [generatedImage, setGeneratedImage] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Categories
    const [expandedCategory, setExpandedCategory] = useState<string | null>('cozinha');

    // --- Search ---
    const [searchTerm, setSearchTerm] = useState('');

    // --- Properties State ---
    const [propWidth, setPropWidth] = useState(0);
    const [propHeight, setPropHeight] = useState(0);
    const [propDepth, setPropDepth] = useState(0);

    // --- Load Custom Blocks ---
    const fetchCustomBlocks = async () => {
        setIsLoadingBlocks(true);
        try {
            const { data, error } = await supabase
                .from('custom_blocks')
                .select('*');

            if (error) throw error;

            if (data && data.length > 0) {
                // Distribute blocks into categories
                setBlockLibrary(prev => {
                    const newLib = { ...prev };

                    data.forEach((block: any) => {
                        const catKey = block.category || 'outros';

                        // Create category if not exists
                        if (!newLib[catKey]) {
                            // Map known keys to nice names, or capitalize
                            const catNames: { [key: string]: string } = {
                                'cozinha': 'Cozinha',
                                'dormitorio': 'Dormitório',
                                'sala': 'Sala',
                                'banheiro': 'Banheiro',
                                'mesas': 'Mesas',
                                'escritorio': 'Escritório',
                                'outros': 'Outros'
                            };

                            newLib[catKey] = {
                                name: catNames[catKey] || catKey.charAt(0).toUpperCase() + catKey.slice(1),
                                blocks: {}
                            };
                        }

                        // Reconstruct Draw Function
                        const drawFunc = (ctx: CanvasRenderingContext2D, x: number, y: number, renderScale: number) => {
                            const builderScale = 4; // The scale used in builder 1cm = 4px
                            const currentScale = renderScale;
                            // const ratio = currentScale / builderScale; // unused

                            if (block.elements && Array.isArray(block.elements)) {
                                block.elements.forEach((elem: any) => {
                                    ctx.strokeStyle = elem.color || '#000';
                                    ctx.fillStyle = elem.color || '#000';
                                    ctx.lineWidth = (elem.lineWidth || 2);
                                    if (elem.dash) ctx.setLineDash([5, 5]);
                                    else ctx.setLineDash([]);

                                    if (elem.type === 'retangulo') {
                                        const bx = (elem.x || 0) / builderScale * renderScale;
                                        const by = (elem.y || 0) / builderScale * renderScale;
                                        const bw = (elem.width || 0) / builderScale * renderScale;
                                        const bh = (elem.height || 0) / builderScale * renderScale;

                                        if (elem.stroke) ctx.strokeRect(x + bx, y + by, bw, bh);
                                        if (elem.fill) ctx.fillRect(x + bx, y + by, bw, bh);

                                    } else if (elem.type === 'linha') {
                                        const x1 = (elem.x1 || 0) / builderScale * renderScale;
                                        const y1 = (elem.y1 || 0) / builderScale * renderScale;
                                        const x2 = (elem.x2 || 0) / builderScale * renderScale;
                                        const y2 = (elem.y2 || 0) / builderScale * renderScale;

                                        ctx.beginPath();
                                        ctx.moveTo(x + x1, y + y1);
                                        ctx.lineTo(x + x2, y + y2);
                                        ctx.stroke();

                                    } else if (elem.type === 'circulo') {
                                        const cx = (elem.x || 0) / builderScale * renderScale;
                                        const cy = (elem.y || 0) / builderScale * renderScale;
                                        const r = (elem.radius || 0) / builderScale * renderScale;

                                        ctx.beginPath();
                                        ctx.arc(x + cx, y + cy, r, 0, Math.PI * 2);
                                        if (elem.fill) ctx.fill();
                                        else ctx.stroke();
                                    }

                                    ctx.setLineDash([]);
                                });
                            }
                        };

                        // Add block to category
                        newLib[catKey].blocks[block.id] = {
                            name: block.name,
                            width: block.dimensions?.width || 50,
                            height: block.dimensions?.height || 50,
                            depth: block.dimensions?.depth || 50,
                            draw: drawFunc
                        };
                    });

                    return newLib;
                });
            }

        } catch (err: any) {
            console.error('Error fetching custom blocks:', err);
        } finally {
            setIsLoadingBlocks(false);
        }
    };

    useEffect(() => {
        fetchCustomBlocks();
    }, []);

    // ============================================
    // CANVAS DRAWING LOOP
    // ============================================
    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Clear
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Background
        ctx.fillStyle = '#f9f9f9';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Grid
        const step = 50 * zoom;
        ctx.beginPath();
        ctx.strokeStyle = '#e5e5e5';
        ctx.lineWidth = 0.5;
        // Verticals
        for (let x = pan.x % step; x < canvas.width; x += step) {
            ctx.moveTo(x, 0);
            ctx.lineTo(x, canvas.height);
        }
        // Horizontals
        for (let y = pan.y % step; y < canvas.height; y += step) {
            ctx.moveTo(0, y);
            ctx.lineTo(canvas.width, y);
        }
        ctx.stroke();

        // Blocks
        ctx.save();
        ctx.translate(pan.x, pan.y);
        ctx.scale(zoom, zoom);

        placedBlocks.forEach(block => {
            const libCat = blockLibrary[block.category];
            if (!libCat) return;
            const def = libCat.blocks[block.type];
            if (!def) return;

            // Highlight if selected
            if (block.selected) {
                ctx.fillStyle = 'rgba(45, 80, 22, 0.1)';
                ctx.fillRect(block.x - 5, block.y - 5, (def.width * scale) + 10, (def.height * scale) + 10);
                ctx.strokeStyle = '#2D5016';
                ctx.lineWidth = 1;
                ctx.strokeRect(block.x - 5, block.y - 5, (def.width * scale) + 10, (def.height * scale) + 10);
            }

            def.draw(ctx, block.x, block.y, scale);

            // Dimensions if selected
            if (block.selected) {
                drawDimensions(ctx, block.x, block.y, def.width * scale, def.height * scale, scale);
            }
        });

        ctx.restore();
    }, [placedBlocks, pan, zoom, scale, blockLibrary]);

    useEffect(() => {
        draw();
    }, [draw]);

    // Handle Resize
    useEffect(() => {
        const handleResize = () => {
            if (containerRef.current && canvasRef.current) {
                canvasRef.current.width = containerRef.current.clientWidth;
                canvasRef.current.height = containerRef.current.clientHeight;
                draw();
            }
        };
        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [draw]);

    // Update Properties Panel when selection changes
    useEffect(() => {
        const selected = placedBlocks.find(b => b.selected);
        if (selected) {
            const libCat = blockLibrary[selected.category];
            if (libCat && libCat.blocks[selected.type]) {
                const def = libCat.blocks[selected.type];
                setPropWidth(def.width);
                setPropHeight(def.height);
                setPropDepth(def.depth);
                setSelectedBlockId(selected.id);
            }
        } else {
            setSelectedBlockId(null);
        }
    }, [placedBlocks, blockLibrary]);


    // ============================================
    // HELPERS
    // ============================================
    const drawDimensions = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, s: number) => {
        ctx.save();
        ctx.strokeStyle = '#8B6914';
        ctx.fillStyle = '#8B6914';
        ctx.lineWidth = 1;
        ctx.font = '12px Arial';

        // Horizontal
        ctx.beginPath();
        ctx.moveTo(x, y - 10);
        ctx.lineTo(x + w, y - 10);
        ctx.stroke();
        ctx.fillText(`${(w / s).toFixed(0)}cm`, x + w / 2 - 15, y - 15);

        // Vertical
        ctx.beginPath();
        ctx.moveTo(x - 10, y);
        ctx.lineTo(x - 10, y + h);
        ctx.stroke();
        ctx.save();
        ctx.translate(x - 15, y + h / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.fillText(`${(h / s).toFixed(0)}cm`, 0, 0);
        ctx.restore();

        ctx.restore();
    };

    // ============================================
    // HANDLERS
    // ============================================
    const addBlock = (category: string, type: string) => {
        const libCat = blockLibrary[category];
        if (!libCat || !libCat.blocks[type]) return;

        // Position center screen (approx)
        const centerX = (-pan.x + (containerRef.current?.clientWidth || 800) / 2) / zoom;
        const centerY = (-pan.y + (containerRef.current?.clientHeight || 600) / 2) / zoom;

        // Reset selection
        const newBlocks = placedBlocks.map(b => ({ ...b, selected: false }));

        newBlocks.push({
            id: Date.now().toString(),
            category,
            type,
            x: centerX,
            y: centerY,
            selected: true
        });
        setPlacedBlocks(newBlocks);
        setActiveTool('select');
    };

    const handleMouseDown = (e: React.MouseEvent) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const startX = e.clientX - rect.left;
        const startY = e.clientY - rect.top;

        if (activeTool === 'pan') {
            setIsDragging(true);
            setDragStart({ x: startX, y: startY });
            setLastPan(pan);
            return;
        }

        // Select Logic
        // Transform mouse to world coords
        const worldX = (startX - pan.x) / zoom;
        const worldY = (startY - pan.y) / zoom;

        // Check hit (iterate reverse for z-order)
        let hitId: string | null = null;
        for (let i = placedBlocks.length - 1; i >= 0; i--) {
            const block = placedBlocks[i];
            const libCat = blockLibrary[block.category];
            if (!libCat) continue;
            const def = libCat.blocks[block.type];
            if (!def) continue;

            const w = def.width * scale;
            const h = def.height * scale;

            if (worldX >= block.x && worldX <= block.x + w &&
                worldY >= block.y && worldY <= block.y + h) {
                hitId = block.id;
                break;
            }
        }

        if (hitId) {
            const updated = placedBlocks.map(b => ({ ...b, selected: b.id === hitId }));
            setPlacedBlocks(updated);
            setIsDragging(true);
            setDragStart({ x: worldX, y: worldY }); // World coords for moving relative
        } else {
            // Deselect all
            setPlacedBlocks(placedBlocks.map(b => ({ ...b, selected: false })));
        }
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;

        const rect = canvasRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        if (activeTool === 'pan') {
            const dx = x - dragStart.x;
            const dy = y - dragStart.y;
            setPan({ x: lastPan.x + dx, y: lastPan.y + dy });
        } else {
            // Move selected block
            const worldX = (x - pan.x) / zoom;
            const worldY = (y - pan.y) / zoom;
            const dx = worldX - dragStart.x;
            const dy = worldY - dragStart.y;

            setPlacedBlocks(prev => prev.map(b => {
                if (b.selected) {
                    return { ...b, x: b.x + dx, y: b.y + dy };
                }
                return b;
            }));
            // Update drag start for continuous delta
            setDragStart({ x: worldX, y: worldY });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };

    const handleWheel = (e: React.WheelEvent) => {
        // e.preventDefault(); // React synthetic events don't support preventDefault on wheel well?
        // In a real app we might attach non-passive listener
        const factor = 1.1;
        if (e.deltaY < 0) {
            setZoom(z => Math.min(z * factor, 5));
        } else {
            setZoom(z => Math.max(z / factor, 0.2));
        }
    };

    const generateImage = async () => {
        if (placedBlocks.length === 0) {
            alert("Adicione blocos antes de gerar a imagem.");
            return;
        }

        setGenerating(true);
        setError(null);
        setGeneratedImage(null);

        try {
            // Create a temporary canvas to export the sketch
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = 1024;
            tempCanvas.height = 768;
            const ctx = tempCanvas.getContext('2d');
            if (!ctx) throw new Error("Could not create canvas context");

            // Fill white background
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

            // Calculate bounds to center the drawing
            // ... (Simple centering logic omitted for brevity, just drawing centered-ish)
            ctx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
            // Assuming user drew near 0,0 mostly or adjusting. 
            // For prototype, just use current pan/zoom or reset?
            // Let's frame the content properly by finding bounding box
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            placedBlocks.forEach(b => {
                minX = Math.min(minX, b.x);
                minY = Math.min(minY, b.y);
                const libCat = blockLibrary[b.category];
                if (libCat && libCat.blocks[b.type]) {
                    const def = libCat.blocks[b.type];
                    maxX = Math.max(maxX, b.x + def.width * scale);
                    maxY = Math.max(maxY, b.y + def.height * scale);
                }
            });

            if (minX === Infinity) { minX = 0; maxX = 100; minY = 0; maxY = 100; }
            const contentW = maxX - minX;
            const contentH = maxY - minY;
            const scaleFit = Math.min((tempCanvas.width - 100) / contentW, (tempCanvas.height - 100) / contentH);

            ctx.scale(scaleFit, scaleFit);
            ctx.translate(-minX - contentW / 2 + (tempCanvas.width / scaleFit) / 2, -minY - contentH / 2 + (tempCanvas.height / scaleFit) / 2); // Center

            placedBlocks.forEach(block => {
                const libCat = blockLibrary[block.category];
                if (!libCat) return;
                const def = libCat.blocks[block.type];
                if (!def) return;
                def.draw(ctx, block.x, block.y, scale);
            });

            const imageData = tempCanvas.toDataURL('image/png');

            // Get settings
            const settings = getSettings();

            // Call Gemini
            const prompt = `Renderize uma imagem fotorealista de alta qualidade baseada neste layout de móveis planejados.
            Estilo: ${settings.style}. Falta de iluminação natural. Materiais de alta qualidade.
             Detalhes do pedido: Cliente quer móveis modernos.`; // You can customize prompt

            const resultUrl = await generateImageFromSketch(imageData, prompt);
            setGeneratedImage(resultUrl);

        } catch (err: any) {
            console.error(err);
            setError("Erro ao gerar imagem. Verifique sua chave API ou tente novamente.");
        } finally {
            setGenerating(false);
        }
    };


    return (
        <div className="flex h-screen bg-white">
            {/* Sidebar Library */}
            <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50">
                <div className="p-4 border-b border-slate-200 bg-white">
                    <h2 className="font-bold text-slate-800 flex items-center gap-2">
                        <Layout className="w-5 h-5 text-indigo-600" />
                        Biblioteca
                    </h2>
                    <input
                        type="text"
                        placeholder="Buscar módulo..."
                        className="mt-2 w-full px-3 py-1.5 bg-slate-100 border-none rounded text-sm focus:ring-2 focus:ring-indigo-500"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {/* Render Categories */}
                    {Object.entries(blockLibrary).map(([catKey, catData]: [string, any]) => (
                        <div key={catKey} className="border border-slate-200 rounded bg-white overflow-hidden">
                            <button
                                onClick={() => setExpandedCategory(expandedCategory === catKey ? null : catKey)}
                                className={`w-full px-3 py-3 text-left font-bold text-sm flex justify-between items-center transition-colors ${expandedCategory === catKey ? 'bg-indigo-50 text-indigo-700 border-b border-indigo-100' : 'bg-white text-slate-700 hover:bg-slate-50'}`}
                            >
                                <div className="flex items-center gap-2">
                                    {expandedCategory === catKey ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                                    {catData.name}
                                </div>
                                {catKey === 'custom' && <span className="text-[10px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200">Meus</span>}
                            </button>

                            {expandedCategory === catKey && (
                                <div className="p-2 grid grid-cols-2 gap-2">
                                    {Object.entries(catData.blocks)
                                        .filter(([key, block]) => block.name.toLowerCase().includes(searchTerm.toLowerCase()))
                                        .map(([key, block]) => (
                                            <button
                                                key={key}
                                                onClick={() => addBlock(catKey, key)}
                                                className="flex flex-col items-center justify-center p-2 border border-slate-100 rounded hover:border-indigo-500 hover:shadow-sm bg-white transition-all h-24"
                                            >
                                                {/* Preview Icon - Simplified representation */}
                                                <div className="w-8 h-8 border-2 border-slate-300 mb-2 rounded-sm relative">
                                                    <div className="absolute inset-0 bg-slate-100 opacity-50"></div>
                                                </div>
                                                <span className="text-[10px] text-center font-medium text-slate-600 line-clamp-2 leading-tight">
                                                    {block.name}
                                                </span>
                                                <span className="text-[9px] text-slate-400 mt-1">
                                                    {block.width}cm
                                                </span>
                                            </button>
                                        ))}
                                </div>
                            )}
                        </div>
                    ))}

                    {isLoadingBlocks && (
                        <div className="text-center p-4 text-xs text-slate-500 animate-pulse">
                            Carregando blocos personalizados...
                        </div>
                    )}
                </div>
            </div>

            {/* Main Area */}
            <div className="flex-1 flex flex-col relative overflow-hidden">
                {/* Toolbar */}
                <div className="absolute top-4 left-4 right-4 z-10 flex justify-between pointer-events-none">
                    <div className="bg-white p-1 rounded-lg shadow-md border border-slate-200 flex gap-1 pointer-events-auto">
                        <button
                            onClick={() => setActiveTool('select')}
                            className={`p-2 rounded ${activeTool === 'select' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-600'}`}
                            title="Selecionar (V)"
                        >
                            <MousePointer2 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setActiveTool('pan')}
                            className={`p-2 rounded ${activeTool === 'pan' ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-slate-100 text-slate-600'}`}
                            title="Mover Tela (H)"
                        >
                            <Move className="w-5 h-5" />
                        </button>
                        <div className="w-px bg-slate-200 mx-1"></div>
                        <button onClick={() => setZoom(z => z + 0.1)} className="p-2 rounded hover:bg-slate-100 text-slate-600">
                            <ZoomIn className="w-5 h-5" />
                        </button>
                        <button onClick={() => setZoom(z => Math.max(0.2, z - 0.1))} className="p-2 rounded hover:bg-slate-100 text-slate-600">
                            <ZoomOut className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="bg-white p-1 rounded-lg shadow-md border border-slate-200 pointer-events-auto">
                        <button
                            onClick={generateImage}
                            disabled={generating}
                            className={`flex items-center gap-2 px-4 py-2 rounded font-semibold text-white transition-all shadow-sm
                                ${generating ? 'bg-indigo-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:shadow'}`}
                        >
                            {generating ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Gerando...
                                </>
                            ) : (
                                <>
                                    <Wand2 className="w-4 h-4" />
                                    Gerar Imagem Realista
                                </>
                            )}
                        </button>
                    </div>
                </div>

                {/* Canvas */}
                <div
                    ref={containerRef}
                    className={`flex-1 bg-[#f0f0f0] overflow-hidden ${activeTool === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                >
                    <canvas
                        ref={canvasRef}
                        onMouseDown={handleMouseDown}
                        onMouseMove={handleMouseMove}
                        onMouseUp={handleMouseUp}
                        onMouseLeave={handleMouseUp}
                        onWheel={handleWheel}
                    />
                </div>
            </div>

            {/* Properties Panel (Right) */}
            {selectedBlockId && (
                <div className="w-64 border-l border-slate-200 bg-white p-4 overflow-y-auto">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Type className="w-4 h-4 text-indigo-600" />
                        Propriedades
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dimensões Originais</label>
                            <div className="grid grid-cols-3 gap-2 mt-2">
                                <div className="bg-slate-50 p-2 rounded border border-slate-100 text-center">
                                    <span className="block text-xs text-slate-400">Largura</span>
                                    <span className="font-mono font-medium text-slate-700">{propWidth}</span>
                                </div>
                                <div className="bg-slate-50 p-2 rounded border border-slate-100 text-center">
                                    <span className="block text-xs text-slate-400">Altura</span>
                                    <span className="font-mono font-medium text-slate-700">{propHeight}</span>
                                </div>
                                <div className="bg-slate-50 p-2 rounded border border-slate-100 text-center">
                                    <span className="block text-xs text-slate-400">Prof.</span>
                                    <span className="font-mono font-medium text-slate-700">{propDepth}</span>
                                </div>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-100">
                            <button
                                onClick={() => {
                                    setPlacedBlocks(placedBlocks.filter(b => b.id !== selectedBlockId));
                                    setSelectedBlockId(null);
                                }}
                                className="w-full py-2 border border-red-200 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors flex items-center justify-center gap-2 text-sm font-semibold"
                            >
                                <ImTrash className="w-4 h-4" /> Excluir Bloco
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Generated Image Overlay */}
            {generatedImage && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8">
                    <div className="bg-white rounded-lg shadow-2xl max-w-4xl max-h-full flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="p-4 border-b flex justify-between items-center">
                            <h3 className="font-bold text-lg">Resultado da IA</h3>
                            <button onClick={() => setGeneratedImage(null)} className="text-slate-400 hover:text-slate-600 text-2xl leading-none">&times;</button>
                        </div>
                        <div className="flex-1 overflow-auto bg-slate-900 flex items-center justify-center p-4">
                            <img src={generatedImage} alt="Generated interior" className="max-w-full max-h-[70vh] object-contain rounded shadow-lg" />
                        </div>
                        <div className="p-4 border-t bg-slate-50 flex justify-end gap-3">
                            <button onClick={() => setGeneratedImage(null)} className="px-4 py-2 text-slate-600 font-medium hover:bg-slate-200 rounded">Fechar</button>
                            <a href={generatedImage} download="corte-certo-ai-render.png" className="px-4 py-2 bg-indigo-600 text-white font-medium hover:bg-indigo-700 rounded flex items-center gap-2">
                                <Download className="w-4 h-4" /> Baixar Imagem
                            </a>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Start Icon for delete button
const ImTrash = ({ className }: { className?: string }) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
);

export default AILab;
