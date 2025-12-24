
import React, { useState, useEffect } from 'react';
import { CabinetModule, ModuleType, AppSettings } from '../types';
import { getSettings } from '../services/storageService';
import { Icons } from './Icon';
import { supabase } from '../services/supabaseClient';

// --- INTERFACES DO BANCO DE DADOS ---
interface MaterialMDF {
    id: number;
    espessura_mm: number;
    categoria: string;
    preco_m2: number;
    fabricante: string;
    largura_padrao_mm: number;
    altura_padrao_mm: number;
    observacoes: string;
}

interface Corredica {
    id: number;
    tipo: string;
    modelo: string;
    preco_par: number;
    capacidade_carga_kg: number;
    amortecimento: boolean;
    comprimento_mm: number;
}

interface ModuleCalculatorProps {
    existingModules: CabinetModule[];
    onUpdateModules: (modules: CabinetModule[]) => void;
    onImportTotal: (total: number) => void;
}

// Interfaces auxiliares para o cálculo
interface CutPart {
    name: string;
    qty: number;
    width: number; // mm
    height: number; // mm
    material: '15mm' | '6mm';
}

interface CalculationResult {
    parts: CutPart[];
    sheets15: number;
    sheets6: number;
    hinges: number;
    slides: number;
    handles: number;
    totalCost: number;
}

const SHEET_WIDTH = 2750; // mm
const SHEET_HEIGHT = 1840; // mm
const SHEET_AREA_M2 = (SHEET_WIDTH * SHEET_HEIGHT) / 1000000; // ~5.06 m2
const CUTTING_WASTE_FACTOR = 1.25; // 25% de margem para perda de corte/sangria

const ModuleCalculator: React.FC<ModuleCalculatorProps> = ({ existingModules, onUpdateModules, onImportTotal }) => {
    const [modules, setModules] = useState<CabinetModule[]>(existingModules || []);
    const [settings] = useState<AppSettings>(getSettings());
    const [showAddForm, setShowAddForm] = useState(false);

    // New Module State
    const [type, setType] = useState<ModuleType>('kitchen_base');
    const [name, setName] = useState('Novo Módulo');
    const [width, setWidth] = useState(80); // cm
    const [height, setHeight] = useState(70); // cm
    const [depth, setDepth] = useState(55); // cm
    const [hasBack, setHasBack] = useState(true);
    const [isMadeirado, setIsMadeirado] = useState(false);

    const [drawers, setDrawers] = useState(0);
    const [slides, setSlides] = useState(0); // NOVO: Estado para corrediças

    const [doors, setDoors] = useState(2);
    const [doorType, setDoorType] = useState<'hinge' | 'sliding' | 'lift'>('hinge');
    const [shelves, setShelves] = useState(1);
    const [partitions, setPartitions] = useState(0);

    // Puxadores
    const [handlesQty, setHandlesQty] = useState(2);
    const [handleType, setHandleType] = useState<'external' | 'profile' | 'integrated' | 'touch'>('external');

    // --- ESTADOS DO BANCO DE DADOS (Knowledge Base) ---
    const [dbMaterials, setDbMaterials] = useState<MaterialMDF[]>([]);
    const [dbSlides, setDbSlides] = useState<Corredica[]>([]);

    const [selectedMaterialId, setSelectedMaterialId] = useState<number | null>(null);
    const [selectedSlideId, setSelectedSlideId] = useState<number | null>(null);

    // Carregar dados do Supabase ao iniciar
    useEffect(() => {
        const loadKnowledgeBase = async () => {
            try {
                // 1. Carrega Materiais MDF (apenas os de 15mm, 18mm ou 25mm que são estruturais)
                const { data: materials } = await supabase
                    .from('materiais_mdf')
                    .select('*')
                    .in('espessura_mm', [15, 18, 25])
                    .order('preco_m2', { ascending: true });

                if (materials && materials.length > 0) {
                    setDbMaterials(materials);
                    // Seleciona o primeiro de 15mm ou o primeiro da lista como padrão
                    const defaultMat = materials.find(m => m.espessura_mm === 15) || materials[0];
                    setSelectedMaterialId(defaultMat.id);
                }

                // 2. Carrega Corrediças
                const { data: slidesList } = await supabase
                    .from('corredicas')
                    .select('*')
                    .order('preco_par', { ascending: true });

                if (slidesList && slidesList.length > 0) {
                    setDbSlides(slidesList);
                    // Tenta achar uma telescópica de 450mm padrão
                    const defaultSlide = slidesList.find(s => s.tipo === 'telescopica' && s.comprimento_mm === 450 && !s.amortecimento) || slidesList[0];
                    setSelectedSlideId(defaultSlide.id);
                }

            } catch (error) {
                console.error("Erro ao carregar Base de Conhecimento:", error);
            }
        };

        loadKnowledgeBase();
    }, []);

    // Atualizar Corrediças automaticamente quando Gavetas mudam
    useEffect(() => {
        setSlides(drawers);
    }, [drawers]);

    // Atualizar quantidade de puxadores automaticamente
    useEffect(() => {
        if (handleType === 'touch') {
            setHandlesQty(0);
        } else {
            setHandlesQty(doors + drawers);
        }
    }, [doors, drawers, handleType]);

    // --- LÓGICA CONSTRUTIVA ---
    const generateCutlist = (): CalculationResult => {
        const parts: CutPart[] = [];

        // Converter dimensões para mm para o cálculo de peças
        const W = width * 10;
        const H = height * 10;
        const D = depth * 10;
        const THICKNESS = 15; // mm (Espessura MDF)

        // 1. CAIXARIA (ESTRUTURA)

        // Laterais (Sempre inteiras na altura)
        parts.push({ name: 'Lateral', qty: 2, width: D, height: H, material: '15mm' });

        // Base (Largura total - 2x espessura das laterais)
        const internalWidth = W - (2 * THICKNESS);
        parts.push({ name: 'Base', qty: 1, width: D, height: internalWidth, material: '15mm' });

        // Teto / Travessas
        if (type === 'kitchen_base') {
            // Gabinetes usam travessas para fixar pedra
            parts.push({ name: 'Travessa Superior', qty: 2, width: 70, height: internalWidth, material: '15mm' });
        } else {
            // Aéreos e Roupeiros usam teto fechado
            parts.push({ name: 'Teto', qty: 1, width: D, height: internalWidth, material: '15mm' });
        }

        // Prateleiras
        if (shelves > 0) {
            // Recuo de 20mm no fundo
            const shelfDepth = D - 20;
            // Divisão da largura se houver divisórias verticais
            const shelfWidth = (internalWidth - (partitions * THICKNESS)) / (partitions + 1);
            parts.push({ name: 'Prateleira', qty: shelves * (partitions + 1), width: shelfDepth, height: shelfWidth, material: '15mm' });
        }

        // Divisórias Verticais
        if (partitions > 0) {
            const partitionHeight = H - (2 * THICKNESS); // Desconta base e teto/travessa (aprox)
            parts.push({ name: 'Divisória', qty: partitions, width: D - 20, height: partitionHeight, material: '15mm' });
        }

        // Fundo (MDF 6mm)
        if (hasBack) {
            parts.push({ name: 'Fundo', qty: 1, width: W, height: H, material: '6mm' });
        }

        // 2. FRENTES (PORTAS E GAVETAS)
        let frontHeightAvailable = H;

        if (drawers > 0) {
            // Altura média da gaveta (estimada)
            const drawerFrontHeight = 160; // 16cm
            const totalDrawerHeight = drawers * drawerFrontHeight;
            frontHeightAvailable -= totalDrawerHeight;

            // Frentes de Gaveta
            parts.push({ name: 'Frente Gaveta', qty: drawers, width: internalWidth + 10, height: drawerFrontHeight - 3, material: '15mm' });

            // Corpo da Gaveta (Caixa)
            const drawerBoxHeight = 120; // 12cm
            const drawerBoxDepth = D - 50; // -5cm do fundo

            // Laterais de Gaveta
            parts.push({ name: 'Lat. Gaveta', qty: drawers * 2, width: drawerBoxDepth, height: drawerBoxHeight, material: '15mm' });
            // Contra-frente e Traseira de Gaveta
            const drawerInternalWidth = internalWidth - 26; // -26mm (folga corrediça)
            parts.push({ name: 'Cabeceira Gaveta', qty: drawers * 2, width: drawerInternalWidth - (2 * THICKNESS), height: drawerBoxHeight, material: '15mm' });
            // Fundo Gaveta
            if (hasBack) {
                parts.push({ name: 'Fundo Gaveta', qty: drawers, width: drawerInternalWidth, height: drawerBoxDepth, material: '6mm' });
            }
        }

        if (doors > 0) {
            // Largura da porta
            const doorWidth = (W / doors) - 3; // -3mm folga
            const doorHeight = frontHeightAvailable - 3;
            parts.push({ name: 'Porta', qty: doors, width: doorWidth, height: doorHeight, material: '15mm' });
        }

        // 3. CÁLCULO DE ÁREA E CUSTO
        let area15mm_m2 = 0;
        let area6mm_m2 = 0;

        parts.forEach(p => {
            const areaM2 = (p.width * p.height * p.qty) / 1000000;
            if (p.material === '15mm') area15mm_m2 += areaM2;
            if (p.material === '6mm') area6mm_m2 += areaM2;
        });

        const finalArea15 = area15mm_m2 * CUTTING_WASTE_FACTOR;
        const finalArea6 = area6mm_m2 * CUTTING_WASTE_FACTOR;

        const sheets15 = Number((finalArea15 / SHEET_AREA_M2).toFixed(2));
        const sheets6 = Number((finalArea6 / SHEET_AREA_M2).toFixed(2));

        // Ferragens
        let hinges = 0;
        if (doorType === 'hinge') {
            const hingesPerDoor = height < 90 ? 2 : height < 160 ? 3 : 4;
            hinges = doors * hingesPerDoor;
        } else if (doorType === 'lift') {
            hinges = doors * 2;
        }

        // Usa o estado 'slides' em vez de drawers para o custo
        const slidesCount = slides;

        // Custo Total
        const mp = settings.materialPrices;

        const price15mm = isMadeirado
            ? (mp.sheetPriceMadeirado || mp.sheetPrice15mm * 1.4)
            : mp.sheetPrice15mm;

        // --- CÁLCULO DINÂMICO DE CUSTO ---
        // Tenta encontrar o material selecionado no BD para pegar o preço real
        const dbMat = dbMaterials.find(m => m.id === selectedMaterialId);
        // Se achou, usa o preço dele. Se for madeirado, adiciona 40% (regra de negócio simples para exemplo)
        const realPrice15 = dbMat ? (isMadeirado ? dbMat.preco_m2 * 1.4 : dbMat.preco_m2) : price15mm;

        const dbSlide = dbSlides.find(s => s.id === selectedSlideId);
        const realSlidePrice = dbSlide ? dbSlide.preco_par : mp.slidePrice;

        const costSheets15 = sheets15 * realPrice15;
        const costSheets6 = sheets6 * mp.sheetPrice6mm;

        let totalCost = costSheets15 + costSheets6;
        totalCost += hinges * mp.hingePrice;
        totalCost += slidesCount * realSlidePrice;
        totalCost += handlesQty * (mp.handlePrice || 15.00); // Utiliza o novo campo handlePrice

        return {
            parts,
            sheets15,
            sheets6,
            hinges,
            slides: slidesCount,
            handles: handlesQty,
            totalCost
        };
    };

    const handleAddModule = () => {
        const calc = generateCutlist();

        const newModule: CabinetModule = {
            id: Date.now().toString(),
            type,
            name,
            width,
            height,
            depth,
            hasBackPanel: hasBack,
            isMadeirado,
            drawersQty: drawers,
            doorsQty: doors,
            doorType,
            isGlassDoor: false,
            shelvesQty: shelves,
            partitionsQty: partitions,
            handlesQty,
            handleType,
            calculatedMdf15Area: calc.sheets15 * SHEET_AREA_M2,
            calculatedMdf6Area: calc.sheets6 * SHEET_AREA_M2,
            calculatedHinges: calc.hinges,
            calculatedSlides: calc.slides, // Salva o valor calculado (baseado no input de corrediças)
            estimatedCost: calc.totalCost
        };

        const updated = [...modules, newModule];
        setModules(updated);
        onUpdateModules(updated);
        setShowAddForm(false);
    };

    const handleRemoveModule = (id: string) => {
        const updated = modules.filter(m => m.id !== id);
        setModules(updated);
        onUpdateModules(updated);
    };

    const totalProjectCost = modules.reduce((acc, m) => acc + m.estimatedCost, 0);

    const totalSheets15 = modules.reduce((acc, m) => acc + (m.calculatedMdf15Area / SHEET_AREA_M2), 0);
    const totalSheets6 = modules.reduce((acc, m) => acc + (m.calculatedMdf6Area / SHEET_AREA_M2), 0);
    const totalHandles = modules.reduce((acc, m) => acc + (m.handlesQty || 0), 0);
    // Total de corrediças somando todos os módulos
    const totalSlidesProject = modules.reduce((acc, m) => acc + (m.calculatedSlides || 0), 0);

    return (
        <div className="space-y-6">
            {!showAddForm ? (
                <div className="space-y-4">
                    <div className="bg-slate-900 p-4 rounded-xl border border-slate-700">
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h3 className="text-wood-400 font-bold uppercase text-sm">Resumo de Materiais</h3>
                                <p className="text-xs text-slate-400">Estimativa baseada em chapa 2.75x1.84m com margem de perda.</p>
                            </div>
                            <button
                                onClick={() => onImportTotal(totalProjectCost)}
                                className="bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-lg text-sm"
                            >
                                <Icons.Dollar className="w-4 h-4" /> Importar Valor (R$ {totalProjectCost.toFixed(2)})
                            </button>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="bg-slate-800 p-3 rounded border border-slate-600">
                                <p className="text-xs text-slate-400">Chapas 15/18mm</p>
                                <p className="text-xl font-bold text-white">{Math.ceil(totalSheets15 * 10) / 10} <span className="text-xs font-normal text-slate-500">un</span></p>
                            </div>
                            <div className="bg-slate-800 p-3 rounded border border-slate-600">
                                <p className="text-xs text-slate-400">Chapas 6mm</p>
                                <p className="text-xl font-bold text-white">{Math.ceil(totalSheets6 * 10) / 10} <span className="text-xs font-normal text-slate-500">un</span></p>
                            </div>
                            <div className="bg-slate-800 p-3 rounded border border-slate-600">
                                <p className="text-xs text-slate-400">Dobradiças</p>
                                <p className="text-xl font-bold text-white">{modules.reduce((a, b) => a + b.calculatedHinges, 0)} <span className="text-xs font-normal text-slate-500">un</span></p>
                            </div>
                            <div className="bg-slate-800 p-3 rounded border border-slate-600">
                                <p className="text-xs text-slate-400">Corrediças</p>
                                <p className="text-xl font-bold text-white">{totalSlidesProject} <span className="text-xs font-normal text-slate-500">par</span></p>
                            </div>
                            <div className="bg-slate-800 p-3 rounded border border-slate-600">
                                <p className="text-xs text-slate-400">Puxadores</p>
                                <p className="text-xl font-bold text-white">{totalHandles} <span className="text-xs font-normal text-slate-500">un</span></p>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button
                            onClick={() => setShowAddForm(true)}
                            className="bg-wood-600 hover:bg-wood-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-bold shadow-lg w-full md:w-auto justify-center"
                        >
                            <Icons.Plus className="w-5 h-5" /> Adicionar Módulo
                        </button>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        {modules.map(mod => (
                            <div key={mod.id} className="bg-slate-800 p-4 rounded-lg border border-slate-700 relative group">
                                <div className="flex justify-between items-start">
                                    <div className="flex items-center gap-2">
                                        <div className={`p-2 rounded ${mod.isMadeirado ? 'bg-amber-900/50 text-amber-500' : 'bg-slate-200 text-slate-600'}`}>
                                            <Icons.Box className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-white flex items-center gap-2">
                                                {mod.name}
                                                {mod.isMadeirado && <span className="text-[10px] bg-amber-900 text-amber-200 px-1 rounded uppercase">Madeirado</span>}
                                            </h4>
                                            <p className="text-xs text-slate-400">
                                                {mod.width}L x {mod.height}A x {mod.depth}P • {mod.type === 'kitchen_base' ? 'Gabinete' : mod.type === 'wardrobe' ? 'Roupeiro' : 'Aéreo'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleRemoveModule(mod.id)}
                                            className="text-slate-500 hover:text-red-400 p-2"
                                        >
                                            <Icons.Trash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2 text-xs text-slate-300 bg-slate-900/50 p-2 rounded">
                                    <span>{mod.doorsQty} Portas</span>
                                    <span>{mod.drawersQty} Gavetas</span>
                                    <span>{mod.calculatedSlides || mod.drawersQty} Corrediças</span>
                                    <span>MDF 15mm: {(mod.calculatedMdf15Area / SHEET_AREA_M2).toFixed(2)} chapa</span>
                                    <span className="font-bold text-green-400">R$ {mod.estimatedCost.toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 animate-fade-in">
                    <div className="flex justify-between mb-6 border-b border-slate-700 pb-4">
                        <h3 className="text-lg font-bold text-white flex items-center gap-2">
                            <Icons.Calculator className="w-5 h-5 text-wood-500" /> Configurar Novo Módulo
                        </h3>
                        <button onClick={() => setShowAddForm(false)}><Icons.Close className="text-slate-400 hover:text-white" /></button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Tipos e Medidas */}
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs text-slate-400 uppercase font-bold">Tipo de Módulo</label>
                                <div className="grid grid-cols-3 gap-2 mt-1">
                                    <button
                                        onClick={() => { setType('kitchen_base'); setHeight(70); setDepth(55); setName('Gabinete Cozinha'); }}
                                        className={`p-2 rounded border text-xs text-center ${type === 'kitchen_base' ? 'bg-wood-600 border-wood-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                                    >
                                        Gabinete
                                    </button>
                                    <button
                                        onClick={() => { setType('kitchen_upper'); setHeight(70); setDepth(35); setName('Aéreo Cozinha'); }}
                                        className={`p-2 rounded border text-xs text-center ${type === 'kitchen_upper' ? 'bg-wood-600 border-wood-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                                    >
                                        Aéreo
                                    </button>
                                    <button
                                        onClick={() => { setType('wardrobe'); setHeight(240); setDepth(60); setName('Roupeiro'); }}
                                        className={`p-2 rounded border text-xs text-center ${type === 'wardrobe' ? 'bg-wood-600 border-wood-500 text-white' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                                    >
                                        Roupeiro
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="text-xs text-slate-400 uppercase font-bold">Nome de Referência</label>
                                <input
                                    value={name} onChange={e => setName(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs text-slate-400 uppercase font-bold">Material (Acabamento)</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setIsMadeirado(false)}
                                        className={`flex-1 p-2 rounded border text-xs flex items-center justify-center gap-2 ${!isMadeirado ? 'bg-slate-100 border-slate-200 text-slate-800 font-bold' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                                    >
                                        <div className="w-3 h-3 bg-white border border-gray-300 rounded-full"></div> Branco TX
                                    </button>
                                    <button
                                        onClick={() => setIsMadeirado(true)}
                                        className={`flex-1 p-2 rounded border text-xs flex items-center justify-center gap-2 ${isMadeirado ? 'bg-amber-900 border-amber-700 text-amber-100 font-bold' : 'bg-slate-900 border-slate-700 text-slate-400'}`}
                                    >
                                        <div className="w-3 h-3 bg-amber-700 rounded-full"></div> Madeirado
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-2">
                                <div>
                                    <label className="text-xs text-slate-400">Largura (cm)</label>
                                    <input
                                        type="number"
                                        value={width || ''}
                                        onChange={e => setWidth(Number(e.target.value))}
                                        onFocus={e => e.target.select()}
                                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">Altura (cm)</label>
                                    <input
                                        type="number"
                                        value={height || ''}
                                        onChange={e => setHeight(Number(e.target.value))}
                                        onFocus={e => e.target.select()}
                                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400">Profund. (cm)</label>
                                    <input
                                        type="number"
                                        value={depth || ''}
                                        onChange={e => setDepth(Number(e.target.value))}
                                        onFocus={e => e.target.select()}
                                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-2 bg-slate-900 p-2 rounded border border-slate-700">
                                <input type="checkbox" checked={hasBack} onChange={e => setHasBack(e.target.checked)} className="w-4 h-4 accent-wood-500" />
                                <span className="text-sm text-slate-300">Incluir Fundo (MDF 6mm)</span>
                            </div>
                        </div>

                        {/* SELEÇÃO INTELIGENTE DE MATERIAIS */}
                        {dbMaterials.length > 0 && (
                            <div className="col-span-1 md:col-span-2 bg-slate-900 p-3 rounded border border-slate-700">
                                <h5 className="text-xs text-wood-400 font-bold uppercase mb-2">Especificação Técnica (Banco de Dados)</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Tipo de Chapa (Estrutura)</label>
                                        <select
                                            value={selectedMaterialId || ''}
                                            onChange={e => setSelectedMaterialId(Number(e.target.value))}
                                            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm"
                                        >
                                            {dbMaterials.map(m => (
                                                <option key={m.id} value={m.id}>
                                                    {m.fabricante} {m.espessura_mm}mm - R$ {m.preco_m2.toFixed(2)}/m² ({m.categoria})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Modelo de Corrediça</label>
                                        <select
                                            value={selectedSlideId || ''}
                                            onChange={e => setSelectedSlideId(Number(e.target.value))}
                                            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm"
                                        >
                                            {dbSlides.map(s => (
                                                <option key={s.id} value={s.id}>
                                                    {s.modelo} - R$ {s.preco_par.toFixed(2)}/par ({s.fabricante})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Divisões e Componentes */}
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase">Portas</label>
                                    <input
                                        type="number"
                                        value={doors || ''}
                                        onChange={e => setDoors(Number(e.target.value))}
                                        onFocus={e => e.target.select()}
                                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white mb-2"
                                    />
                                    <select value={doorType} onChange={e => setDoorType(e.target.value as any)} className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white text-sm">
                                        <option value="hinge">Giro (Dobradiça)</option>
                                        <option value="sliding">Correr</option>
                                        <option value="lift">Basculante</option>
                                    </select>
                                </div>

                                {/* GAVETAS E CORREDIÇAS AGORA NO LADO DIREITO */}
                                <div className="space-y-2">
                                    <div>
                                        <label className="text-xs text-slate-400 font-bold uppercase">Gavetas</label>
                                        <input
                                            type="number"
                                            value={drawers || ''}
                                            onChange={e => setDrawers(Number(e.target.value))}
                                            onFocus={e => e.target.select()}
                                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 font-bold uppercase flex justify-between">
                                            Corrediças
                                            <span className="text-[10px] text-wood-500 font-normal normal-case">(Pares)</span>
                                        </label>
                                        <input
                                            type="number"
                                            value={slides || ''}
                                            onChange={e => setSlides(Number(e.target.value))}
                                            onFocus={e => e.target.select()}
                                            className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase">Prateleiras</label>
                                    <input
                                        type="number"
                                        value={shelves || ''}
                                        onChange={e => setShelves(Number(e.target.value))}
                                        onFocus={e => e.target.select()}
                                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">Divisões Horizontais</p>
                                </div>
                                <div>
                                    <label className="text-xs text-slate-400 font-bold uppercase">Divisórias</label>
                                    <input
                                        type="number"
                                        value={partitions || ''}
                                        onChange={e => setPartitions(Number(e.target.value))}
                                        onFocus={e => e.target.select()}
                                        className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-white"
                                    />
                                    <p className="text-[10px] text-slate-500 mt-1">Divisões Verticais</p>
                                </div>
                            </div>

                            {/* Puxadores */}
                            <div className="bg-slate-900 p-3 rounded border border-slate-700">
                                <h5 className="text-xs text-wood-400 font-bold uppercase mb-2">Acabamentos / Ferragens</h5>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Tipo de Puxador</label>
                                        <select
                                            value={handleType}
                                            onChange={e => setHandleType(e.target.value as any)}
                                            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white text-sm"
                                        >
                                            <option value="external">Externo (Parafuso)</option>
                                            <option value="profile">Perfil (Alumínio)</option>
                                            <option value="integrated">Cava/Usinado</option>
                                            <option value="touch">Touch (S/ Puxador)</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="text-xs text-slate-400 block mb-1">Qtd. Puxadores</label>
                                        <input
                                            type="number"
                                            value={handlesQty || ''}
                                            onChange={e => setHandlesQty(Number(e.target.value))}
                                            onFocus={e => e.target.select()}
                                            className="w-full bg-slate-800 border border-slate-600 rounded p-2 text-white"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Prévia do Cálculo */}
                    <div className="mt-6 bg-black/20 p-4 rounded-lg">
                        <h4 className="text-sm font-bold text-wood-400 mb-2 uppercase">Estimativa de Material (Tempo Real)</h4>
                        <div className="grid grid-cols-3 gap-4 text-sm text-slate-300">
                            <div>
                                <span className="block text-xs text-slate-500">MDF 15/18mm</span>
                                <span className="font-mono text-white">{generateCutlist().sheets15} chapas</span>
                                <span className="text-[10px] text-slate-500 block">{isMadeirado ? '(Madeirado)' : '(Branco)'}</span>
                            </div>
                            <div>
                                <span className="block text-xs text-slate-500">MDF 6mm</span>
                                <span className="font-mono text-white">{generateCutlist().sheets6} chapas</span>
                            </div>
                            <div>
                                <span className="block text-xs text-slate-500">Custo Total</span>
                                <span className="font-mono text-green-400">R$ {generateCutlist().totalCost.toFixed(2)}</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-end gap-4">
                        <button onClick={() => setShowAddForm(false)} className="text-slate-400 hover:text-white px-4">Cancelar</button>
                        <button onClick={handleAddModule} className="bg-wood-600 hover:bg-wood-500 text-white px-6 py-2 rounded-lg font-bold shadow-lg">
                            Calcular e Adicionar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ModuleCalculator;
