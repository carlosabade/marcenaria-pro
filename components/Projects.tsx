
import React, { useState, useEffect, useRef } from 'react';
import { Project, AppSettings, MaterialBreakdown, CompanyProfile, ProjectFeedback, CabinetModule, FixedCost, ContractClause, ProjectVideo } from '../types';
import { getProjects, updateProject, getSettings, getCompanyProfile, calculateProjectFinancials, getUser, incrementDownloadCount, getFixedCosts, calculateHourlyRate, saveCompanyProfile } from '../services/storageService';
import { Icons } from './Icon';
import ModuleCalculator from './ModuleCalculator';
import PaywallModal from './PaywallModal';
import { useSubscription } from '../hooks/useSubscription';
import { UpgradePrompt } from './UpgradePrompt';

const MIN_MARGIN = 20;
const DEFAULT_CARPENTER_PERCENT = 20;
const FREE_DOWNLOAD_LIMIT = 3;

const initialBreakdown: MaterialBreakdown = {
    mdfMadeirado: 0,
    mdfBranco15: 0,
    mdfBranco6: 0,
    corredicas: 0,
    dobradicas: 0,
    colaContato: 0,
    colaInstantanea: 0,
    parafusos: 0,
    fitaBorda: 0,
    outros: 0
};

const Projects: React.FC = () => {
    const [projects, setProjects] = useState<Project[]>([]);
    const [settings, setSettings] = useState<AppSettings>(getSettings());
    const [company, setCompany] = useState<CompanyProfile>(getCompanyProfile());
    const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'details' | 'calculator' | 'chat' | 'contract' | 'videos'>('details');

    const [contractView, setContractView] = useState<'edit' | 'preview'>('edit');
    const [lastFocusedClause, setLastFocusedClause] = useState<string | null>(null);

    const [pdfDocType, setPdfDocType] = useState<'none' | 'contract' | 'quote'>('none');
    const [isExporting, setIsExporting] = useState(false);
    const [showPaywall, setShowPaywall] = useState(false);
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

    // Subscription hook
    const subscription = useSubscription();

    const [clauses, setClauses] = useState<ContractClause[]>([]);
    const [newVideoUrl, setNewVideoUrl] = useState('');
    const [newVideoTitle, setNewVideoTitle] = useState('');
    const [, setTick] = useState(0);

    const [form, setForm] = useState<Partial<Project>>({});
    const [breakdown, setBreakdown] = useState<MaterialBreakdown>(initialBreakdown);

    // Lógica para controle do botão salvar
    const [isDirty, setIsDirty] = useState(false);

    const [newMessage, setNewMessage] = useState('');
    const chatEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setProjects(getProjects());
        setSettings(getSettings());
        const cp = getCompanyProfile();
        setCompany(cp);
        setFixedCosts(getFixedCosts());
    }, []);

    useEffect(() => {
        if (editingId && activeTab === 'contract') {
            if (form.customClauses && form.customClauses.length > 0) {
                setClauses(form.customClauses);
            } else if (clauses.length === 0) {
                setClauses(company.contractTemplate || []);
            }
        }
    }, [editingId, activeTab, company.contractTemplate, form.customClauses]);

    const hourlyRate = calculateHourlyRate(fixedCosts, settings);
    const effectiveSettings = { ...settings, hourlyRate };

    // Monitorar mudanças para ativar o botão de salvar
    useEffect(() => {
        if (editingId) {
            setIsDirty(true);
        }
    }, [form, breakdown, clauses]);

    useEffect(() => {
        if (editingId && activeTab === 'details') {
            const total = (Object.values(breakdown) as number[]).reduce((a, b) => a + (Number(b) || 0), 0);
            if (Math.abs(total - (form.materialsCost || 0)) > 0.01) {
                setForm(prev => ({ ...prev, materialsCost: total, materialsBreakdown: breakdown }));
            }
        }
    }, [breakdown, editingId, activeTab]);

    const handleEdit = (project: Project) => {
        setEditingId(project.id);
        setForm({ ...project });
        setBreakdown(project.materialsBreakdown || initialBreakdown);
        setClauses(project.customClauses && project.customClauses.length > 0
            ? project.customClauses
            : (company.contractTemplate || []));
        setActiveTab('details');
        // Reset dirty state when opening existing project
        setTimeout(() => setIsDirty(false), 100);
    };

    const handleNew = () => {
        // Check project limit
        if (!subscription.canCreateProject(projects.length)) {
            setShowUpgradePrompt(true);
            return;
        }

        setEditingId('new');
        setBreakdown(initialBreakdown);
        setActiveTab('details');
        const currentCompany = getCompanyProfile();
        setCompany(currentCompany);
        setClauses(currentCompany.contractTemplate || []);

        setForm({
            clientName: '',
            clientCpf: '',
            clientAddress: '',
            clientCity: '',
            projectType: '',
            contractDescription: '',
            paymentTerms: currentCompany.defaultPaymentTerms || '',
            startDate: new Date().toISOString().split('T')[0],
            deadline: '',
            status: 'quote',
            materialsCost: 0,
            productionDays: 0,
            assemblyDays: 0,
            freightCost: 0,
            estimatedHours: 0,
            marginPercent: 35,
            taxPercent: 0,
            carpenterPercent: DEFAULT_CARPENTER_PERCENT,
            notes: '',
            feedbacks: [],
            modules: [],
            videos: []
        });
        setIsDirty(true);
    };

    const handleSave = () => {
        if (!form.clientName || !form.projectType) {
            alert("Preencha o nome do cliente e o tipo de móvel.");
            return;
        }

        const prodDays = Number(form.productionDays) || 0;
        const assDays = Number(form.assemblyDays) || 0;
        const totalHours = (prodDays + assDays) * settings.workingHoursPerDay;

        const newProject: Project = {
            id: editingId === 'new' ? crypto.randomUUID() : (editingId as string),
            clientName: form.clientName || '',
            clientCpf: form.clientCpf || '',
            clientAddress: form.clientAddress || '',
            clientCity: form.clientCity || '',
            projectType: form.projectType || '',
            contractDescription: form.contractDescription || '',
            paymentTerms: form.paymentTerms || '',
            clientSignature: form.clientSignature || '',
            startDate: form.startDate || new Date().toISOString(),
            deadline: form.deadline || '',
            status: (form.status as any) || 'active',
            materialsCost: Number(form.materialsCost) || 0,
            materialsBreakdown: breakdown,
            productionDays: prodDays,
            assemblyDays: assDays,
            freightCost: Number(form.freightCost) || 0,
            estimatedHours: totalHours,
            estimatedDays: prodDays + assDays,
            finalPrice: financials.suggestedPrice, // Save this!
            marginPercent: Number(form.marginPercent) || MIN_MARGIN,
            taxPercent: Number(form.taxPercent) || 0,
            carpenterPercent: Number(form.carpenterPercent) || 0,
            notes: form.notes || '',
            feedbacks: form.feedbacks || [],
            modules: form.modules || [],
            videos: form.videos || [],
            customClauses: clauses
        };

        updateProject(newProject);
        setProjects(getProjects());
        setIsDirty(false); // Desliga o botão após salvar
        if (editingId === 'new') setEditingId(newProject.id);
    };

    const handleUpdateModules = (updatedModules: CabinetModule[]) => {
        setForm(prev => ({ ...prev, modules: updatedModules }));
        setIsDirty(true);
    };

    const handleImportTotalFromCalculator = (total: number) => {
        setBreakdown({ ...initialBreakdown, outros: total });
        setForm(prev => ({ ...prev, materialsCost: total }));
        setActiveTab('details');
        setIsDirty(true);
        alert('Valor total importado com sucesso!');
    };

    const handleUpdateClause = (id: string, field: 'title' | 'text', value: string) => {
        setClauses(prev => prev.map(c => c.id === id ? { ...c, [field]: value } : c));
        setIsDirty(true);
    };

    const handleInsertVariable = (variable: string) => {
        const targetId = lastFocusedClause || (clauses.length > 0 ? clauses[0].id : null);
        if (!targetId) return;

        const element = document.getElementById(`clause-input-${targetId}`) as HTMLTextAreaElement;
        if (element) {
            const start = element.selectionStart;
            const end = element.selectionEnd;
            const text = element.value;
            const before = text.substring(0, start);
            const after = text.substring(end);
            const newText = before + variable + after;
            handleUpdateClause(targetId, 'text', newText);
            setTimeout(() => {
                element.focus();
                element.setSelectionRange(start + variable.length, start + variable.length);
            }, 0);
        }
    };

    const handleAddClause = () => {
        const newClause: ContractClause = {
            id: Date.now().toString(),
            title: 'NOVA CLÁUSULA',
            text: 'Digite aqui...',
            editable: true
        };
        setClauses([...clauses, newClause]);
        setIsDirty(true);
    };

    const handleDeleteClause = (id: string) => {
        if (confirm('Remover cláusula?')) {
            setClauses(clauses.filter(c => c.id !== id));
            setIsDirty(true);
        }
    };

    const handleResetContract = () => {
        if (confirm('Restaurar modelo padrão da oficina?')) {
            setClauses(company.contractTemplate || []);
            setIsDirty(true);
        }
    };

    const handleExportPDF = (type: 'contract' | 'quote') => {
        const user = getUser();
        if (user?.plan === 'free' && (user.downloadCount || 0) >= FREE_DOWNLOAD_LIMIT) {
            setShowPaywall(true);
            return;
        }

        incrementDownloadCount();
        setTick(t => t + 1);
        setPdfDocType(type);
        setIsExporting(true);

        setTimeout(() => {
            generatePDF(type);
        }, 500);
    };

    const generatePDF = (type: 'contract' | 'quote') => {
        const elementId = type === 'contract' ? 'contract-pdf-source' : 'quote-render-container';
        const element = document.getElementById(elementId);

        if (!element) {
            setIsExporting(false);
            setPdfDocType('none');
            return;
        }

        const opt = {
            margin: 0,
            filename: `${form.clientName}_${type}.pdf`,
            image: { type: 'jpeg', quality: 0.98 },
            html2canvas: { scale: 2, useCORS: true },
            jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
        };

        // @ts-ignore
        window.html2pdf().set(opt).from(element).save().then(() => {
            setIsExporting(false);
            setPdfDocType('none');
        });
    };

    const handleAddVideo = () => {
        if (!newVideoTitle || !newVideoUrl) return;
        let embedUrl = newVideoUrl;
        if (newVideoUrl.includes('youtube.com/watch?v=')) embedUrl = newVideoUrl.replace('watch?v=', 'embed/');
        else if (newVideoUrl.includes('youtu.be/')) embedUrl = newVideoUrl.replace('youtu.be/', 'youtube.com/embed/');

        const newVideo: ProjectVideo = {
            id: Date.now().toString(),
            title: newVideoTitle,
            url: newVideoUrl,
            embedUrl: embedUrl,
            date: new Date().toISOString()
        };

        setForm(prev => ({ ...prev, videos: [...(prev.videos || []), newVideo] }));
        setNewVideoTitle('');
        setNewVideoUrl('');
        setIsDirty(true);
    };

    const handleDeleteVideo = (id: string) => {
        setForm(prev => ({ ...prev, videos: prev.videos?.filter(v => v.id !== id) }));
        setIsDirty(true);
    };

    const handleAddFeedback = () => {
        if (!newMessage.trim()) return;

        const newFeedback: ProjectFeedback = {
            id: Date.now().toString(),
            date: new Date().toISOString(),
            message: newMessage,
            type: 'internal'
        };

        setForm(prev => ({
            ...prev,
            feedbacks: [...(prev.feedbacks || []), newFeedback]
        }));
        setNewMessage('');
        setIsDirty(true);

        setTimeout(() => {
            chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleShare = () => {
        let token = form.public_token;

        // 🛡️ Ensure Token is Valid UUID (Migrate if legacy)
        if (!token || !token.includes('-') || token.length < 20) {
            token = crypto.randomUUID();
            const updatedForm = { ...form, public_token: token };
            setForm(updatedForm);

            // Also update the local state list to prevent reversion
            const updatedProjects = projects.map(p => p.id === form.id ? { ...p, public_token: token } : p);
            setProjects(updatedProjects);
        }

        // 🔥 CRITICAL: Save immediately to DB so the link works!
        if (form.clientName && form.projectType) {
            const newId = editingId === 'new' ? crypto.randomUUID() : (editingId as string);

            const projectToSave: Project = {
                ...(form as Project), // Base on current form
                id: newId,
                public_token: token,
                // Ensure defaults for safety to avoid validation errors if user hit share early
                status: (form.status as any) || 'active',
                materialsCost: Number(form.materialsCost) || 0,
                finalPrice: financials ? financials.suggestedPrice : (Number(form.materialsCost) * 2), // Fallback
                clientName: form.clientName || 'Cliente',
                projectType: form.projectType || 'Projeto',
                createdAt: form.createdAt || new Date().toISOString()
            };

            // Call storage service (which auto-syncs)
            updateProject(projectToSave);
            setProjects(getProjects()); // Refresh list
            setIsDirty(false); // Mark as saved
        } else {
            alert("Por favor, preencha pelo menos o Nome do Cliente e Tipo de Móvel antes de gerar o link.");
            return;
        }

        const url = `${window.location.origin}/p/${token}`;
        navigator.clipboard.writeText(url);
        alert(`🔗 Link Gerado e Salvo!\n\n${url}\n\nCopiado para a área de transferência.`);
    };

    const financials = editingId ? calculateProjectFinancials(form, effectiveSettings) : null;
    const currentUser = getUser();
    const isFreeUser = currentUser?.plan === 'free';

    if (editingId && financials) {
        const today = new Date().toLocaleDateString('pt-BR');
        const deadlineDate = form.deadline ? new Date(form.deadline).toLocaleDateString('pt-BR') : '____/____/____';

        const generatedDescription = form.modules && form.modules.length > 0
            ? form.modules.map((m, i) => `${i + 1}. ${m.name} (${m.width}x${m.height}x${m.depth}cm) - ${m.doorsQty} portas, ${m.drawersQty} gavetas`).join('\n')
            : form.contractDescription || 'Mobiliário sob medida conforme projeto.';

        const replaceVariables = (text: string) => {
            return text
                .replace(/{{CLIENTE_NOME}}/g, form.clientName || '_______________________')
                .replace(/{{CLIENTE_CPF}}/g, form.clientCpf || '________________')
                .replace(/{{CLIENTE_ENDERECO}}/g, form.clientAddress || '________________________________')
                .replace(/{{CLIENTE_CIDADE}}/g, form.clientCity || '________________')
                .replace(/{{EMPRESA_NOME}}/g, company.name || 'CONTRATADA')
                .replace(/{{EMPRESA_CNPJ}}/g, company.cnpj || '')
                .replace(/{{VALOR_TOTAL}}/g, financials.suggestedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 }))
                .replace(/{{DATA_ENTREGA}}/g, deadlineDate)
                .replace(/{{FORMA_PAGAMENTO}}/g, form.paymentTerms || 'A combinar')
                .replace(/{{CIDADE_DATA}}/g, `${form.clientCity || 'Local'}, ${today}`)
                .replace(/{{DESCRICAO_ITENS}}/g, generatedDescription);
        };

        const updateBreakdown = (key: keyof MaterialBreakdown, value: string) => {
            setBreakdown(prev => ({ ...prev, [key]: parseFloat(value) || 0 }));
            setIsDirty(true);
        };

        const ContractContent = () => (
            <div className="bg-white text-black font-serif text-[11pt] leading-relaxed p-[2.5cm] w-[210mm] min-h-[297mm] mx-auto flex flex-col justify-between box-border">
                <div>
                    <div className="text-center mb-10 border-b-2 border-black pb-4">
                        {company.logo && <img src={company.logo} alt="Logo" className="h-20 mx-auto mb-2 object-contain" />}
                        <h1 className="text-lg font-bold uppercase tracking-widest">Contrato de Prestação de Serviços de Marcenaria</h1>
                    </div>

                    <div className="mb-8 text-justify">
                        <p className="mb-2"><strong>CONTRATADA:</strong> {company.name}, {company.cnpj && `CNPJ: ${company.cnpj},`} com sede em {company.address}, contato {company.contact}.</p>
                        <p><strong>CONTRATANTE:</strong> {form.clientName}, CPF/CNPJ {form.clientCpf}, residente em {form.clientAddress}, {form.clientCity}.</p>
                    </div>

                    <div className="space-y-6 text-justify">
                        {clauses.map((clause) => (
                            <div key={clause.id}>
                                <h2 className="font-bold uppercase mb-1">{clause.title}</h2>
                                <p className="whitespace-pre-wrap">{replaceVariables(clause.text)}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-12">
                    <p className="text-center mb-12 italic text-sm">As partes assinam o presente em duas vias de igual teor.</p>
                    <div className="flex justify-between items-end gap-16 px-8">
                        <div className="flex-1 text-center">
                            <div className="h-24 flex items-end justify-center mb-1">
                                {company.signature && <img src={company.signature} alt="Rubrica" className="max-h-24 object-contain" />}
                            </div>
                            <div className="border-t border-black pt-2 text-[10px] uppercase font-bold">{company.name}</div>
                        </div>
                        <div className="flex-1 text-center">
                            <div className="h-24"></div>
                            <div className="border-t border-black pt-2 text-[10px] uppercase font-bold">{form.clientName}</div>
                        </div>
                    </div>
                </div>
            </div>
        );

        const QuoteDocument = () => (
            <div id="quote-render-container" className="bg-white text-black font-serif p-[2cm] w-[210mm] min-h-[297mm] mx-auto relative box-border">
                <div className="flex items-center gap-6 border-b-4 border-slate-800 pb-6 mb-8">
                    {company.logo && <img src={company.logo} alt="Logo" className="w-24 h-24 object-contain" />}
                    <div className="flex-1">
                        <h1 className="text-2xl font-black uppercase text-slate-800">{company.name}</h1>
                        <p className="text-sm text-slate-600">{company.address}</p>
                        <p className="text-sm text-slate-600">Contato: {company.contact}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-xl font-bold uppercase tracking-widest text-wood-700">Orçamento</h2>
                        <p className="text-sm font-bold mt-1">Nº {editingId.slice(-6)}</p>
                    </div>
                </div>

                <div className="bg-slate-100 p-6 rounded-xl mb-8 flex justify-between font-sans">
                    <div>
                        <h3 className="text-[10px] font-black uppercase text-slate-400 mb-1">Dados do Cliente</h3>
                        <p className="text-lg font-bold text-slate-800">{form.clientName}</p>
                        <p className="text-xs text-slate-600">{form.clientAddress}, {form.clientCity}</p>
                    </div>
                    <div className="text-right">
                        <h3 className="text-[10px] font-black uppercase text-slate-400 mb-1">Data de Emissão</h3>
                        <p className="text-sm font-bold">{today}</p>
                    </div>
                </div>

                <div className="mb-10 font-sans">
                    <h3 className="font-bold text-slate-800 border-b-2 pb-2 mb-4 uppercase text-sm tracking-wider">Descrição dos Itens / Escopo do Projeto</h3>
                    <div className="bg-white border rounded-xl p-6 text-sm leading-relaxed whitespace-pre-wrap">
                        {replaceVariables("{{DESCRICAO_ITENS}}")}
                    </div>
                </div>

                <div className="flex justify-end font-sans">
                    <div className="text-right bg-slate-900 text-white p-8 rounded-2xl w-2/3 shadow-xl">
                        <p className="text-wood-400 uppercase text-xs font-bold mb-2 tracking-widest">Investimento Total</p>
                        <p className="text-5xl font-black">R$ {financials.suggestedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        <div className="mt-6 pt-6 border-t border-slate-700 text-left">
                            <p className="text-[10px] text-slate-400 uppercase font-bold mb-2">Condições de Pagamento</p>
                            <p className="text-sm text-slate-200">{form.paymentTerms}</p>
                        </div>
                    </div>
                </div>
            </div>
        );

        return (
            <>
                {showPaywall && <PaywallModal onClose={() => setShowPaywall(false)} onSuccess={() => setShowPaywall(false)} />}

                <div className="fixed top-0 left-0 w-[210mm] z-[-50] bg-white overflow-hidden invisible">
                    <div id="contract-pdf-source"><ContractContent /></div>
                    <div id="quote-render-container"><QuoteDocument /></div>
                </div>

                <div className="bg-slate-800 p-4 md:p-6 rounded-xl border border-slate-700 animate-fade-in relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 sticky -top-6 bg-slate-800 p-4 border-b border-slate-700 z-20">
                        <h2 className="text-lg font-bold text-white flex items-center gap-2">
                            <Icons.Edit className="text-wood-500 w-5 h-5" /> {editingId === 'new' ? 'Novo Orçamento' : 'Editar Projeto'}
                        </h2>

                        <div className="flex bg-slate-900 rounded-lg p-1 overflow-x-auto max-w-full">
                            <button onClick={() => setActiveTab('details')} className={`px-4 py-2 text-xs font-bold rounded-md whitespace-nowrap ${activeTab === 'details' ? 'bg-wood-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}>Dados & Insumos</button>
                            <button onClick={() => setActiveTab('calculator')} className={`px-4 py-2 text-xs font-bold rounded-md flex items-center gap-2 whitespace-nowrap ${activeTab === 'calculator' ? 'bg-wood-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Icons.Calculator className="w-3 h-3" /> Calculadora Módulos</button>
                            <button onClick={() => setActiveTab('contract')} className={`px-4 py-2 text-xs font-bold rounded-md flex items-center gap-2 whitespace-nowrap ${activeTab === 'contract' ? 'bg-wood-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Icons.FileText className="w-3 h-3" /> Contrato</button>
                            <button onClick={() => setActiveTab('videos')} className={`px-4 py-2 text-xs font-bold rounded-md flex items-center gap-2 whitespace-nowrap ${activeTab === 'videos' ? 'bg-wood-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Icons.Video className="w-3 h-3" /> Vídeos</button>
                            <button onClick={() => setActiveTab('chat')} className={`px-4 py-2 text-xs font-bold rounded-md flex items-center gap-2 whitespace-nowrap ${activeTab === 'chat' ? 'bg-wood-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}><Icons.Message className="w-3 h-3" /> Notas</button>
                        </div>

                        <div className="flex gap-2">
                            <button onClick={handleShare} className="bg-wood-600 hover:bg-wood-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all">
                                <Icons.Share className="w-4 h-4" /> Link do Cliente
                            </button>
                            <button onClick={() => handleExportPDF('quote')} className="bg-wood-700 hover:bg-wood-600 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all">
                                <Icons.Download className="w-4 h-4" /> Orçamento PDF
                            </button>
                            <button onClick={() => setEditingId(null)} className="text-slate-400 hover:text-white bg-slate-700 p-2 rounded-full"><Icons.Close /></button>
                        </div>
                    </div>

                    {activeTab === 'details' && (
                        <div className="space-y-6 animate-fade-in">
                            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700">
                                <h3 className="text-wood-400 font-bold mb-4 uppercase text-xs tracking-widest flex items-center gap-2">
                                    <Icons.User className="w-4 h-4" /> Dados para Documentos
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">Cliente</label>
                                        <input className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-wood-500" value={form.clientName} onChange={e => { setForm({ ...form, clientName: e.target.value }); setIsDirty(true); }} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">Tipo de Móvel</label>
                                        <select
                                            className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-wood-500 cursor-pointer"
                                            value={form.projectType || ''}
                                            onChange={e => { setForm({ ...form, projectType: e.target.value }); setIsDirty(true); }}
                                        >
                                            <option value="">Selecione...</option>
                                            <option value="Cozinha">Cozinha</option>
                                            <option value="Dormitório">Dormitório</option>
                                            <option value="Sala">Sala</option>
                                            <option value="Banheiro">Banheiro</option>
                                            <option value="Escritório">Escritório</option>
                                            <option value="Lavanderia">Lavanderia</option>
                                            <option value="Closet">Closet</option>
                                            <option value="Área Gourmet">Área Gourmet</option>
                                            <option value="Varanda">Varanda</option>
                                            <option value="Outros">Outros</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">CPF / CNPJ</label>
                                        <input className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-wood-500" value={form.clientCpf || ''} onChange={e => { setForm({ ...form, clientCpf: e.target.value }); setIsDirty(true); }} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">Cidade</label>
                                        <input className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-wood-500" value={form.clientCity} onChange={e => { setForm({ ...form, clientCity: e.target.value }); setIsDirty(true); }} />
                                    </div>
                                    <div className="space-y-1 md:col-span-2">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">Endereço de Instalação</label>
                                        <input className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-wood-500" value={form.clientAddress} onChange={e => { setForm({ ...form, clientAddress: e.target.value }); setIsDirty(true); }} />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">Entrega</label>
                                        <input type="date" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white outline-none focus:border-wood-500" value={form.deadline} onChange={e => { setForm({ ...form, deadline: e.target.value }); setIsDirty(true); }} />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700">
                                <h3 className="text-wood-400 font-bold mb-4 uppercase text-xs tracking-widest flex items-center gap-2">
                                    <Icons.Hammer className="w-4 h-4" /> Insumos & Materiais (Orçamento na Hora)
                                </h3>

                                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 mb-6">
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">MDF Branco 15mm</label>
                                        <input type="number" step="0.01" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm" value={breakdown.mdfBranco15 || ''} onChange={e => updateBreakdown('mdfBranco15', e.target.value)} onFocus={e => e.target.select()} placeholder="0,00" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">MDF Madeirado</label>
                                        <input type="number" step="0.01" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm" value={breakdown.mdfMadeirado || ''} onChange={e => updateBreakdown('mdfMadeirado', e.target.value)} onFocus={e => e.target.select()} placeholder="0,00" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">MDF 6mm</label>
                                        <input type="number" step="0.01" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm" value={breakdown.mdfBranco6 || ''} onChange={e => updateBreakdown('mdfBranco6', e.target.value)} onFocus={e => e.target.select()} placeholder="0,00" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">Cola Contato</label>
                                        <input type="number" step="0.01" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm" value={breakdown.colaContato || ''} onChange={e => updateBreakdown('colaContato', e.target.value)} onFocus={e => e.target.select()} placeholder="0,00" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">Cola Instantânea</label>
                                        <input type="number" step="0.01" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm" value={breakdown.colaInstantanea || ''} onChange={e => updateBreakdown('colaInstantanea', e.target.value)} onFocus={e => e.target.select()} placeholder="0,00" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">Parafusos</label>
                                        <input type="number" step="0.01" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm" value={breakdown.parafusos || ''} onChange={e => updateBreakdown('parafusos', e.target.value)} onFocus={e => e.target.select()} placeholder="0,00" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">Fita de Borda</label>
                                        <input type="number" step="0.01" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm" value={breakdown.fitaBorda || ''} onChange={e => updateBreakdown('fitaBorda', e.target.value)} onFocus={e => e.target.select()} placeholder="0,00" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">Dobradiças</label>
                                        <input type="number" step="0.01" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm" value={breakdown.dobradicas || ''} onChange={e => updateBreakdown('dobradicas', e.target.value)} onFocus={e => e.target.select()} placeholder="0,00" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">Corrediças</label>
                                        <input type="number" step="0.01" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm" value={breakdown.corredicas || ''} onChange={e => updateBreakdown('corredicas', e.target.value)} onFocus={e => e.target.select()} placeholder="0,00" />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[10px] text-slate-500 font-bold uppercase">Outros Itens</label>
                                        <input type="number" step="0.01" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white font-mono text-sm" value={breakdown.outros || ''} onChange={e => updateBreakdown('outros', e.target.value)} onFocus={e => e.target.select()} placeholder="0,00" />
                                    </div>
                                </div>

                                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-wood-900/30 rounded-lg">
                                            <Icons.Dollar className="text-wood-500 w-6 h-6" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase">Total de Materiais</p>
                                            <p className="text-2xl font-black text-white font-mono">R$ {(form.materialsCost || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                        </div>
                                    </div>

                                    <div className="w-full md:w-auto space-y-1">
                                        <label className="text-[10px] text-wood-500 font-bold uppercase">Valor do Frete (R$)</label>
                                        <input type="number" step="0.01" className="w-full md:w-48 bg-slate-900 border border-wood-900/50 rounded-xl p-3 text-white font-mono text-base outline-none focus:border-wood-500" value={form.freightCost || ''} onChange={e => { setForm({ ...form, freightCost: Number(e.target.value) }); setIsDirty(true); }} onFocus={e => e.target.select()} placeholder="0,00" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700 space-y-6">
                                    <h3 className="text-wood-400 font-bold uppercase text-xs tracking-widest flex items-center gap-2">
                                        <Icons.Calendar className="w-4 h-4" /> Estimativa de Tempo
                                    </h3>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-slate-500 font-bold uppercase">Dias Oficina</label>
                                            <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white" value={form.productionDays || ''} onChange={e => { setForm({ ...form, productionDays: Number(e.target.value) }); setIsDirty(true); }} onFocus={e => e.target.select()} />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] text-slate-500 font-bold uppercase">Dias Montagem</label>
                                            <input type="number" className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white" value={form.assemblyDays || ''} onChange={e => { setForm({ ...form, assemblyDays: Number(e.target.value) }); setIsDirty(true); }} onFocus={e => e.target.select()} />
                                        </div>
                                    </div>
                                </div>

                                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-wood-400 font-bold uppercase text-xs tracking-widest flex items-center gap-2"><Icons.Chart className="w-4 h-4" /> Margem de Lucro</h3>
                                        <span className="text-2xl font-black text-white">{form.marginPercent}%</span>
                                    </div>
                                    <input type="range" min="15" max="100" step="1" value={form.marginPercent || 35} onChange={e => { setForm({ ...form, marginPercent: Number(e.target.value) }); setIsDirty(true); }} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-wood-600 mb-4" />
                                    <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase">
                                        <span>Mínima (15%)</span>
                                        <span>Sugerida (35%)</span>
                                        <span>Premium (50%+)</span>
                                    </div>
                                </div>

                                <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700 col-span-1 md:col-span-2">
                                    <div className="flex justify-between items-center mb-4">
                                        <h3 className="text-wood-400 font-bold uppercase text-xs tracking-widest flex items-center gap-2"><Icons.User className="w-4 h-4" /> Comissão Marceneiro (Produção)</h3>
                                        <span className="text-2xl font-black text-white">{form.carpenterPercent}%</span>
                                    </div>
                                    <input type="range" min="0" max="50" step="1" value={form.carpenterPercent || 0} onChange={e => { setForm({ ...form, carpenterPercent: Number(e.target.value) }); setIsDirty(true); }} className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-green-600 mb-4" />
                                    <div className="flex justify-between text-[10px] text-slate-500 font-bold uppercase">
                                        <span>Nenhuma (0%)</span>
                                        <span>Média Mercado (20%)</span>
                                        <span>Sócio/Expert (40%+)</span>
                                    </div>
                                    <div className="mt-2 text-right">
                                        <p className="text-[10px] text-slate-500 uppercase">Valor estimado p/ marceneiro:</p>
                                        <p className="text-sm font-bold text-green-400">R$ {financials.carpenterValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-r from-wood-800 to-wood-950 p-8 rounded-2xl text-white shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
                                <div>
                                    <p className="text-wood-400 text-[10px] uppercase font-black tracking-widest mb-1">Preço Sugerido para o Cliente</p>
                                    <p className="text-5xl font-black">R$ {financials.suggestedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                                    <p className="text-xs text-wood-400 mt-2">Soma de materiais, custos fixos e frete + margens aplicadas.</p>
                                </div>

                                <button
                                    onClick={handleSave}
                                    disabled={!isDirty}
                                    className={`font-black py-4 px-12 rounded-xl shadow-xl transition-all flex items-center gap-3 active:scale-95 ${isDirty
                                        ? 'bg-white text-wood-900 scale-105 shadow-wood-500/20 animate-pulse border-2 border-white'
                                        : 'bg-slate-700 text-slate-500 opacity-50 grayscale cursor-not-allowed border-2 border-transparent'
                                        }`}
                                >
                                    <Icons.Save className={`w-5 h-5 ${isDirty ? 'text-wood-600' : ''}`} />
                                    {isDirty ? 'Salvar Alterações' : 'Nada para Salvar'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'contract' && (
                        <div className="animate-fade-in flex flex-col gap-6">
                            <div className="flex bg-slate-900 p-2 rounded-2xl border border-slate-700 items-center justify-between">
                                <div className="flex gap-2">
                                    <button onClick={() => setContractView('edit')} className={`px-6 py-2 rounded-xl font-bold text-xs transition-all ${contractView === 'edit' ? 'bg-wood-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Editor Jurídico</button>
                                    <button onClick={() => setContractView('preview')} className={`px-6 py-2 rounded-xl font-bold text-xs transition-all ${contractView === 'preview' ? 'bg-wood-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>Prévia do PDF</button>
                                </div>
                                <div className="flex gap-2 mr-2">
                                    <button onClick={() => handleExportPDF('contract')} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-all">
                                        <Icons.Download className="w-4 h-4" /> Exportar Contrato PDF
                                    </button>
                                    <button onClick={handleResetContract} className="text-[10px] text-slate-500 hover:text-white font-bold uppercase tracking-widest px-2">Resetar p/ Padrão</button>
                                </div>
                            </div>

                            {contractView === 'edit' ? (
                                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                                    <div className="lg:col-span-3 space-y-4 max-h-[600px] overflow-y-auto pr-2 no-scrollbar">
                                        {clauses.map((clause) => (
                                            <div key={clause.id} className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700" onClick={() => setLastFocusedClause(clause.id)}>
                                                <div className="flex justify-between items-center mb-4">
                                                    <input value={clause.title} onChange={(e) => handleUpdateClause(clause.id, 'title', e.target.value)} className="bg-transparent text-wood-400 font-black uppercase text-xs border-b border-transparent focus:border-wood-500 outline-none w-full" />
                                                    <button onClick={() => handleDeleteClause(clause.id)} className="text-slate-700 hover:text-red-500 ml-4"><Icons.Trash className="w-4 h-4" /></button>
                                                </div>
                                                <textarea id={`clause-input-${clause.id}`} value={clause.text} onChange={(e) => handleUpdateClause(clause.id, 'text', e.target.value)} onFocus={() => setLastFocusedClause(clause.id)} className="w-full bg-slate-950/40 border border-slate-800 rounded-xl p-4 text-sm text-slate-300 outline-none focus:border-wood-600 min-h-[120px] leading-relaxed" />
                                            </div>
                                        ))}
                                        <button onClick={handleAddClause} className="w-full py-6 border-2 border-dashed border-slate-700 rounded-2xl text-slate-500 hover:text-wood-500 hover:border-wood-600 transition-all font-black text-xs uppercase">Inserir Nova Cláusula</button>
                                    </div>

                                    <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-700 h-fit space-y-4">
                                        <h4 className="text-white font-bold text-xs uppercase tracking-widest mb-4">Tags Automáticas</h4>
                                        <p className="text-[10px] text-slate-500 mb-4 leading-tight">Clique para inserir no local do cursor:</p>
                                        <div className="grid grid-cols-1 gap-2">
                                            {[
                                                { label: 'Nome Cliente', tag: '{{CLIENTE_NOME}}' },
                                                { label: 'Valor Total', tag: '{{VALOR_TOTAL}}' },
                                                { label: 'Data Entrega', tag: '{{DATA_ENTREGA}}' },
                                                { label: 'Itens Projeto', tag: '{{DESCRICAO_ITENS}}' },
                                                { label: 'Cidade/Data', tag: '{{CIDADE_DATA}}' }
                                            ].map(v => (
                                                <button key={v.tag} onMouseDown={(e) => e.preventDefault()} onClick={() => handleInsertVariable(v.tag)} className="text-left px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-[10px] text-slate-300 transition-colors border border-slate-700">{v.label}</button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="bg-slate-700 rounded-2xl p-8 overflow-y-auto max-h-[800px] shadow-inner flex justify-center">
                                    <div className="shadow-2xl origin-top transform scale-75 md:scale-100">
                                        <ContractContent />
                                    </div>
                                </div>
                            )}

                            <div className="flex justify-end p-4 border-t border-slate-700">
                                <button
                                    onClick={handleSave}
                                    disabled={!isDirty}
                                    className={`font-black py-3 px-10 rounded-xl shadow-xl transition-all flex items-center gap-3 active:scale-95 ${isDirty
                                        ? 'bg-white text-wood-900 scale-105 border-2 border-white'
                                        : 'bg-slate-700 text-slate-500 opacity-50 grayscale cursor-not-allowed border-2 border-transparent'
                                        }`}
                                >
                                    <Icons.Save className="w-5 h-5" />
                                    {isDirty ? 'Salvar Contrato' : 'Contrato Salvo'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'calculator' && (
                        <ModuleCalculator existingModules={form.modules || []} onUpdateModules={handleUpdateModules} onImportTotal={handleImportTotalFromCalculator} />
                    )}

                    {activeTab === 'videos' && (
                        <div className="animate-fade-in bg-slate-900/50 p-8 rounded-2xl border border-slate-700 space-y-8">
                            <div className="flex flex-col md:flex-row gap-4 items-end bg-slate-800 p-6 rounded-2xl">
                                <div className="flex-1 w-full">
                                    <label className="text-[10px] text-slate-500 font-black mb-2 block uppercase">Título</label>
                                    <input value={newVideoTitle} onChange={e => setNewVideoTitle(e.target.value)} placeholder="Ex: Montagem Gaveteiro" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm" />
                                </div>
                                <div className="flex-1 w-full">
                                    <label className="text-[10px] text-slate-500 font-black mb-2 block uppercase">Link YouTube</label>
                                    <input value={newVideoUrl} onChange={e => setNewVideoUrl(e.target.value)} placeholder="https://youtube.com/..." className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm" />
                                </div>
                                <button onClick={handleAddVideo} className="bg-wood-600 hover:bg-wood-500 text-white px-8 py-3 rounded-xl font-black shadow-lg transition-all w-full md:w-auto">Adicionar</button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                {form.videos?.map(video => (
                                    <div key={video.id} className="bg-slate-800 rounded-2xl overflow-hidden shadow-xl border border-slate-700 group">
                                        <div className="aspect-video bg-black">
                                            {video.embedUrl.includes('youtube.com') ? (
                                                <iframe src={video.embedUrl} title={video.title} className="w-full h-full" allowFullScreen></iframe>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-wood-500"><Icons.Video /></div>
                                            )}
                                        </div>
                                        <div className="p-4 flex justify-between items-center">
                                            <h4 className="font-bold text-white text-xs truncate">{video.title}</h4>
                                            <button onClick={() => handleDeleteVideo(video.id)} className="text-slate-500 hover:text-red-500"><Icons.Trash className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex justify-end p-4 border-t border-slate-700">
                                <button
                                    onClick={handleSave}
                                    disabled={!isDirty}
                                    className={`font-black py-3 px-10 rounded-xl shadow-xl transition-all flex items-center gap-3 active:scale-95 ${isDirty
                                        ? 'bg-white text-wood-900 scale-105 border-2 border-white'
                                        : 'bg-slate-700 text-slate-500 opacity-50 grayscale cursor-not-allowed border-2 border-transparent'
                                        }`}
                                >
                                    <Icons.Save className="w-5 h-5" />
                                    {isDirty ? 'Salvar Vídeos' : 'Vídeos Salvos'}
                                </button>
                            </div>
                        </div>
                    )}

                    {activeTab === 'chat' && (
                        <div className="h-[600px] flex flex-col bg-slate-900 rounded-2xl border border-slate-700 animate-fade-in shadow-2xl overflow-hidden">
                            <div className="flex-1 overflow-y-auto p-6 space-y-4 no-scrollbar">
                                {form.feedbacks?.map(item => (
                                    <div key={item.id} className="flex flex-col bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-sm max-w-[85%]">
                                        <div className="flex justify-between items-center mb-2"><span className="text-[10px] text-wood-500 font-black uppercase tracking-widest">Nota Interna</span><span className="text-[9px] text-slate-500 font-bold">{new Date(item.date).toLocaleString()}</span></div>
                                        <p className="text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">{item.message}</p>
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                            <div className="p-4 bg-slate-800 border-t border-slate-700 flex gap-3 shadow-inner">
                                <input value={newMessage} onChange={e => setNewMessage(e.target.value)} placeholder="Adicionar registro de conversa ou nota importante..." className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-sm outline-none focus:border-wood-500 transition-all" onKeyDown={e => e.key === 'Enter' && handleAddFeedback()} />
                                <button onClick={handleAddFeedback} className="bg-wood-600 hover:bg-wood-500 text-white p-4 rounded-xl shadow-lg transition-all active:scale-95"><Icons.Send className="w-5 h-5" /></button>
                            </div>

                            <div className="flex justify-end p-4 bg-slate-800 border-t border-slate-700">
                                <button
                                    onClick={handleSave}
                                    disabled={!isDirty}
                                    className={`font-black py-3 px-10 rounded-xl shadow-xl transition-all flex items-center gap-3 active:scale-95 ${isDirty
                                        ? 'bg-white text-wood-900 scale-105 border-2 border-white'
                                        : 'bg-slate-700 text-slate-500 opacity-50 grayscale cursor-not-allowed border-2 border-transparent'
                                        }`}
                                >
                                    <Icons.Save className="w-5 h-5" />
                                    {isDirty ? 'Salvar Notas' : 'Notas Salvas'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </>
        );
    }

    return (
        <>
            <UpgradePrompt
                isOpen={showUpgradePrompt}
                onClose={() => setShowUpgradePrompt(false)}
                feature="projects"
                currentCount={projects.length}
                limit={subscription.getProjectLimit()}
            />

            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-2xl font-black text-white tracking-tight">Meus Projetos</h2>
                        {!subscription.isPaid && (
                            <p className="text-xs text-slate-500 mt-1">
                                {projects.length} / {subscription.getProjectLimit()} projetos usados
                            </p>
                        )}
                    </div>
                    <button onClick={handleNew} className="bg-wood-600 hover:bg-wood-500 text-white px-8 py-3 rounded-xl flex items-center gap-3 shadow-xl font-black transition-all active:scale-95"><Icons.Plus className="w-5 h-5" /> Novo Orçamento</button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {projects.map(p => {
                        const fin = calculateProjectFinancials(p, effectiveSettings);
                        const totalDays = (p.productionDays || 0) + (p.assemblyDays || 0);
                        const totalCost = p.materialsCost + (fin.carpenterValue || 0) + (p.freightCost || 0);
                        const dailyCost = totalDays > 0 ? totalCost / totalDays : 0;

                        return (
                            <div key={p.id} className="bg-slate-800 rounded-2xl border border-slate-700 overflow-hidden hover:border-wood-600 transition-all hover:shadow-2xl group relative cursor-pointer" onClick={() => handleEdit(p)}>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-3">
                                        <h3 className="text-xl font-black text-white truncate pr-4">{p.clientName}</h3>
                                        <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest ${p.status === 'completed' ? 'bg-green-900/50 text-green-400' : p.status === 'active' ? 'bg-blue-900/50 text-blue-400' : 'bg-yellow-900/50 text-yellow-400'}`}>{p.status === 'quote' ? 'Orçamento' : p.status === 'completed' ? 'Finalizado' : 'Produção'}</span>
                                    </div>
                                    <p className="text-wood-500 text-xs font-black uppercase tracking-widest mb-6">{p.projectType}</p>
                                    <div className="space-y-3 bg-slate-950/30 p-4 rounded-2xl border border-slate-700/50">
                                        <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500"><span>Materiais</span><span className="text-slate-200 font-mono">R$ {p.materialsCost.toFixed(2)}</span></div>
                                        <div className="flex justify-between text-[10px] uppercase font-bold text-slate-500"><span>Mão de Obra</span><span className="text-slate-200 font-mono">R$ {fin.carpenterValue.toFixed(2)}</span></div>
                                        <div className="flex justify-between text-[10px] uppercase font-bold text-wood-500/80"><span>Custo por Dia</span><span className="text-wood-200 font-mono">R$ {dailyCost.toFixed(2)}</span></div>
                                        <div className="flex justify-between border-t border-slate-700 pt-3 mt-3"><span className="text-[10px] uppercase font-black text-wood-500 tracking-tighter">Venda Final</span><span className="text-green-500 font-black font-mono text-xl">R$ {fin.suggestedPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span></div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                    {projects.length === 0 && (
                        <div className="col-span-full text-center py-20 text-slate-600 bg-slate-800/30 rounded-3xl border-2 border-dashed border-slate-800"><Icons.Hammer className="w-20 h-20 mx-auto mb-6 opacity-20" /><p className="text-lg font-black uppercase tracking-widest">Sua Oficina está silenciosa</p></div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Projects;
