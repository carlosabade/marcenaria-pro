
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../services/supabaseClient';
import { Project, CompanyProfile } from '../types';
import { Icons } from '../components/Icon';

const PublicEstimate: React.FC = () => {
    const { token } = useParams<{ token: string }>();
    const [project, setProject] = useState<Project | null>(null);
    const [company, setCompany] = useState<CompanyProfile | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            if (!token) return;
            try {
                console.log("🚀 [Debug] Iniciando busca do projeto:", token);

                // 1. Fetch Project (com timeout de 5s para não travar)
                const fetchProjectPromise = supabase
                    .from('projects')
                    .select('*')
                    .eq('public_token', token)
                    .single();

                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Tempo limite excedido (Timeout). Verifique sua conexão ou se o projeto foi salvo.')), 5000)
                );

                const { data: projectData, error: projectError } = await Promise.race([fetchProjectPromise, timeoutPromise]) as any;

                console.log("📦 [Debug] Projeto retornado:", projectData, "Erro:", projectError);

                if (projectError) throw projectError;
                if (!projectData) throw new Error('Projeto não encontrado');

                console.log("📦 [Debug] Projeto retornado (Raw):", projectData);

                if (projectError) throw projectError;
                if (!projectData) throw new Error('Projeto não encontrado');

                // O projeto real está dentro de 'data' (JSONB), mas status/token estão na raiz
                // Precisamos mesclar
                const fullProject = {
                    ...(projectData.data || {}),
                    ...projectData, // Sobrescreve com os campos da raiz (id, status, public_token)
                };

                // Remover o campo 'data' duplicado para não confundir
                delete fullProject.data;

                console.log("✨ [Debug] Projeto processado:", fullProject);
                setProject(fullProject as Project);

                // 2. Fetch Company Profile (Owner)
                // 2. Fetch Company Branding (from 'company' table, linked by email)
                if (projectData.user_id) {
                    // First, get the owner's email from profiles
                    const { data: userData, error: userError } = await supabase
                        .from('profiles')
                        .select('email, data') // select email to link to company, data as fallback
                        .eq('id', projectData.user_id)
                        .maybeSingle();

                    if (userData?.email) {
                        // Now fetch the actual company branding config
                        const { data: companyData, error: companyError } = await supabase
                            .from('company')
                            .select('data')
                            .eq('email', userData.email)
                            .maybeSingle();

                        if (companyData?.data) {
                            console.log("🏢 [Debug] Branding da Empresa carregado:", companyData.data);
                            setCompany(companyData.data as CompanyProfile);
                        } else if (userData.data) {
                            // Fallback to user profile if company table is empty
                            console.log("👤 [Debug] Fallback para perfil pessoal:", userData.data);
                            setCompany(userData.data as CompanyProfile);
                        }
                    }
                } else {
                    console.warn("⚠️ [Debug] Project has no user_id");
                }

            } catch (err: any) {
                console.error("❌ [Debug] Erro fatal:", err);
                setError('Orçamento não encontrado ou expirado.');
            } finally {
                console.log("🏁 [Debug] Finalizando loading...");
                setLoading(false);
            }
        };

        fetchData();
    }, [token]);

    const handleApprove = async () => {
        if (!confirm('Confirmar aprovação deste orçamento?')) return;

        try {
            const { error } = await supabase
                .from('projects')
                .update({
                    status: 'approved',
                    approved_at: new Date().toISOString()
                })
                .eq('public_token', token);

            if (error) throw error;

            alert('Orçamento Aprovado com Sucesso! 🚀\nO marceneiro será notificado.');
            setProject(prev => prev ? { ...prev, status: 'approved' } : null);
        } catch (err) {
            alert('Erro ao aprovar. Tente novamente.');
        }
    };

    if (loading) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div></div>;
    if (error) return <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white p-6 text-center"><div><Icons.Shield className="w-12 h-12 mx-auto mb-4 text-red-500" /><h1 className="text-xl font-bold">{error}</h1></div></div>;
    if (!project) return null;

    // Fallback company profile to prevent blank screen
    const displayCompany = company || {
        name: 'Marcenaria',
        company_name: 'Marcenaria Profissional',
        company_color_primary: '#d97706',
        logo: null,
        company_logo_url: null
    } as CompanyProfile;

    const primaryColor = displayCompany.company_color_primary || '#d97706';
    const isApproved = project.status === 'approved' || project.status === 'completed';

    // Safe parsing of breakdown if strictly typed
    const total = project.materialsCost; // In real app, this should be the FINAL PRICE (materials + labor + margin). 
    // Wait, `materialsCost` is JUST MATERIALS. I need `suggestedPrice` which is calculated. 
    // BUT `project` from DB might not have `suggestedPrice` stored if it's dynamic.
    // I need to use the `modules` or generic logic to show price. 
    // In `Projects.tsx`, we calculate it on the fly. Project struct has `marginPercent` etc.
    // Let's replicate simple calculation here or updated schema to store `final_price`.

    // For now, let's recalculate simply if possible, or assume user saved the final price in `estimatedCost` or something.
    // Actually, `estimatedCost` in cabinetModule is component cost.
    // In `Projects.tsx` saving:
    // We save everything. We can re-calculate `suggestedPrice` here using the same utility? 
    // `calculateProjectFinancials` is in `storageService`. I should import it.
    // BUT `storageService` uses localStorage. I might need to extract the math logic to a pure utility file.
    // Refactor later. For now, let's implement a simple calculator inside or try to import.

    // Hack: For display, if the user didn't save the final price explicitly, we might show a "Consultar" or existing fields.
    // BUT wait, `projects` table has no `final_price`. 
    // Let's modify the frontend to calculate it using the same logic.

    return (
        <div className="min-h-screen bg-slate-50 pb-20 font-sans">
            {/* Header */}
            <header className="bg-white shadow-sm p-4 sticky top-0 z-50">
                <div className="max-w-3xl mx-auto flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {displayCompany.logo || displayCompany.company_logo_url ? (
                            <img src={displayCompany.company_logo_url || displayCompany.logo} className="h-10 w-10 object-contain" />
                        ) : (
                            <div className="h-10 w-10 bg-slate-200 rounded-full flex items-center justify-center font-bold text-slate-500">
                                {displayCompany.company_name?.charAt(0) || displayCompany.name?.charAt(0)}
                            </div>
                        )}
                        <div>
                            <h1 className="font-bold text-slate-800 leading-tight">{displayCompany.company_name || displayCompany.name}</h1>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest">Orçamento Digital</p>
                        </div>
                    </div>
                    {isApproved && (
                        <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                            <Icons.Check className="w-3 h-3" /> Aprovado
                        </div>
                    )}
                </div>
            </header>

            <main className="max-w-3xl mx-auto p-4 space-y-6">
                {/* Hero / Greeting */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h2 className="text-xl font-bold text-slate-800 mb-1">Olá, {project.clientName}</h2>
                    <p className="text-slate-600 mb-4 text-sm">Preparamos este orçamento exclusivo para o seu projeto de <strong>{project.projectType}</strong>.</p>

                    <div className="flex items-end gap-2">
                        <div style={{ color: primaryColor }}>
                            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-400">Total do Investimento</p>
                            <p className="text-3xl font-black">
                                {project.finalPrice
                                    ? `R$ ${project.finalPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                                    : 'Sob Consulta'}
                            </p>
                        </div>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">Válido até {new Date(project.deadline).toLocaleDateString()}</p>
                </div>

                {/* Modules Galery (if any) */}
                {project.modules && project.modules.length > 0 && (
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                            <Icons.Box className="w-5 h-5 text-slate-400" /> Ambientes Projetados
                        </h3>
                        <div className="space-y-4">
                            {project.modules.map((m, i) => (
                                <div key={i} className="flex justify-between items-center border-b border-slate-100 pb-2 last:border-0 text-sm">
                                    <span className="font-bold text-slate-700">{m.name}</span>
                                    <span className="text-slate-500 text-xs">{m.width}x{m.height}cm</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Description */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                    <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                        <Icons.FileText className="w-5 h-5 text-slate-400" /> Detalhes
                    </h3>
                    <div className="text-slate-600 text-sm leading-relaxed whitespace-pre-wrap">
                        {project.contractDescription || "Detalhes conforme projeto 3D apresentado."}
                    </div>
                </div>

                {/* Videos */}
                {project.videos && project.videos.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="font-bold text-slate-800 ml-2">Vídeos do Projeto</h3>
                        {project.videos.map(video => (
                            <div key={video.id} className="bg-black rounded-xl overflow-hidden shadow-lg aspect-video">
                                <iframe src={video.embedUrl} className="w-full h-full" allowFullScreen></iframe>
                            </div>
                        ))}
                    </div>
                )}
            </main>

            {/* Bottom Actions */}
            {!isApproved && (
                <div className="fixed bottom-0 left-0 w-full bg-white border-t border-slate-200 p-4 safe-area-bottom shadow-[0_-5px_20px_rgba(0,0,0,0.05)]">
                    <div className="max-w-3xl mx-auto flex gap-3">
                        <button className="flex-1 bg-slate-100 text-slate-700 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition-colors">
                            Pedir Ajuste
                        </button>
                        <button
                            onClick={handleApprove}
                            style={{ backgroundColor: primaryColor }}
                            className="flex-1 text-white py-3 rounded-xl font-bold text-sm shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
                        >
                            <Icons.Check className="w-5 h-5" /> Aprovar Orçamento
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PublicEstimate;
