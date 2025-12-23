
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CompanyProfile, AppSettings, UserProfile, ContractClause } from '../types';
import { getCompanyProfile, saveCompanyProfile, getSettings, saveSettings, getUser, logoutUser, syncToCloud, pullFromCloud, getLastSyncDate, getDeviceId, removeDevice, getDeviceLimit, deleteAllProjects } from '../services/storageService';
import { Icons } from './Icon';
import { AlertTriangle } from 'lucide-react';
import FixedCosts from './FixedCosts';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'profile' | 'company' | 'contract' | 'portal' | 'costs' | 'sync' | 'devices'>('profile');
    const [profile, setProfile] = useState<CompanyProfile>({
        name: '',
        cnpj: '',
        address: '',
        contact: '',
        logo: '',
        signature: '',
        defaultPaymentTerms: '',
        contractTemplate: []
    });
    const [settings, setSettingsState] = useState<AppSettings>(getSettings());
    const [user, setUser] = useState<UserProfile | null>(null);
    const [lastSync, setLastSync] = useState<string | null>(getLastSyncDate());

    const [isDirty, setIsDirty] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [syncLoading, setSyncLoading] = useState(false);
    const currentDeviceId = getDeviceId();

    useEffect(() => {
        setProfile(getCompanyProfile());
        setSettingsState(getSettings());
        setUser(getUser());
        setLastSync(getLastSyncDate());
    }, []);

    const handleProfileChange = (field: keyof CompanyProfile, value: string) => {
        setProfile(prev => ({ ...prev, [field]: value }));
        setIsDirty(true);
        setShowSuccess(false);
    };

    const handleUpdateClause = (id: string, field: 'title' | 'text', value: string) => {
        const updated = profile.contractTemplate?.map(c => c.id === id ? { ...c, [field]: value } : c) || [];
        setProfile(prev => ({ ...prev, contractTemplate: updated }));
        setIsDirty(true);
    };

    const handleAddClause = () => {
        const newClause: ContractClause = {
            id: Date.now().toString(),
            title: 'NOVA CLÁUSULA',
            text: 'Descreva os termos aqui...',
            editable: true
        };
        setProfile(prev => ({ ...prev, contractTemplate: [...(prev.contractTemplate || []), newClause] }));
        setIsDirty(true);
    };

    const handleDeleteClause = (id: string) => {
        setProfile(prev => ({ ...prev, contractTemplate: prev.contractTemplate?.filter(c => c.id !== id) }));
        setIsDirty(true);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'logo' | 'signature') => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setProfile(prev => ({ ...prev, [field]: reader.result as string }));
                setIsDirty(true);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSaveAll = () => {
        saveCompanyProfile(profile);
        saveSettings(settings);
        setIsDirty(false);
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    const handleCloudSync = async () => {
        setSyncLoading(true);
        const res = await syncToCloud();
        setSyncLoading(false);
        if (res.success) {
            setLastSync(new Date().toISOString());
            setUser(getUser());
        }
        alert(res.message);
    };

    const handleCloudPull = async () => {
        if (!confirm("Isso irá substituir seus dados locais pelos dados da nuvem. Continuar?")) return;
        setSyncLoading(true);
        const res = await pullFromCloud();
        setSyncLoading(false);
        if (res.success) {
            alert(res.message);
            window.location.reload();
        } else {
            alert("Erro: " + res.message);
        }
    };

    const handleRemoveDevice = (id: string) => {
        if (id === currentDeviceId) {
            alert("Você não pode remover o dispositivo atual.");
            return;
        }
        if (confirm("Desvincular este dispositivo?")) {
            removeDevice(id);
            setUser(getUser());
        }
    };

    return (
        <div className="space-y-6 relative">
            {showSuccess && (
                <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded shadow-xl animate-fade-in font-bold flex items-center gap-2">
                    <Icons.Save className="w-5 h-5" /> Alterações salvas!
                </div>
            )}

            <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Configurações</h2>
            </div>

            <div className="flex gap-4 border-b border-slate-700 pb-1 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('profile')} className={`pb-3 px-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'profile' ? 'text-wood-400 border-b-2 border-wood-500' : 'text-slate-400 hover:text-white'}`}>Meu Perfil</button>
                <button onClick={() => setActiveTab('company')} className={`pb-3 px-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'company' ? 'text-wood-400 border-b-2 border-wood-500' : 'text-slate-400 hover:text-white'}`}>Dados da Empresa</button>
                <button onClick={() => setActiveTab('contract')} className={`pb-3 px-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'contract' ? 'text-wood-400 border-b-2 border-wood-500' : 'text-slate-400 hover:text-white'}`}>Modelo de Contrato</button>
                <button onClick={() => setActiveTab('portal')} className={`pb-3 px-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'portal' ? 'text-wood-400 border-b-2 border-wood-500' : 'text-slate-400 hover:text-white'}`}>Portal do Cliente</button>
                <button onClick={() => setActiveTab('devices')} className={`pb-3 px-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'devices' ? 'text-wood-400 border-b-2 border-wood-500' : 'text-slate-400 hover:text-white'}`}>Dispositivos</button>
                <button onClick={() => setActiveTab('costs')} className={`pb-3 px-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'costs' ? 'text-wood-400 border-b-2 border-wood-500' : 'text-slate-400 hover:text-white'}`}>Custos & Oficina</button>
                <button onClick={() => setActiveTab('sync')} className={`pb-3 px-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'sync' ? 'text-wood-400 border-b-2 border-wood-500' : 'text-slate-400 hover:text-white'}`}>Sincronização</button>
            </div>

            {activeTab === 'profile' && (
                <div className="animate-fade-in space-y-6">
                    {/* DANGER ZONE - TOP VISIBILITY */}
                    <div className="bg-red-500/10 border-2 border-red-500/50 p-6 rounded-2xl flex items-center justify-between shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className="bg-red-500/20 p-3 rounded-full">
                                <AlertTriangle className="w-8 h-8 text-red-500" />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-red-500 uppercase tracking-wide">Zona de Perigo</h3>
                                <p className="text-slate-300 font-medium">Precisa zerar tudo? Apague todos os projetos aqui.</p>
                            </div>
                        </div>
                        <button
                            onClick={async () => {
                                if (confirm("ATENÇÃO: Isso apagará TODOS os seus projetos permanentemente.\n\nTem certeza absoluta?")) {
                                    if (confirm("Última chance: Todos os orçamentos serão perdidos. Confirmar exclusão total?")) {
                                        await deleteAllProjects();
                                        alert("Todos os projetos foram apagados.");
                                        window.location.reload();
                                    }
                                }
                            }}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wider shadow-xl transition-all hover:scale-105 active:scale-95"
                        >
                            DELETAR TUDO
                        </button>
                    </div>

                    <div className="bg-slate-800 p-8 rounded-2xl border border-slate-700 flex flex-col md:flex-row items-center gap-8 shadow-xl">
                        <div className="bg-gradient-to-br from-wood-600 to-wood-800 h-24 w-24 rounded-full flex items-center justify-center text-4xl font-bold text-white shadow-2xl">
                            {user?.name?.charAt(0)}
                        </div>
                        <div className="flex-1 text-center md:text-left">
                            <h3 className="text-3xl font-bold text-white mb-1">{user?.name}</h3>
                            <p className="text-slate-400 mb-6">{user?.email}</p>
                            <div className="flex flex-wrap justify-center md:justify-start gap-3">
                                <div className={`px-4 py-2 rounded-xl text-xs font-bold uppercase flex items-center gap-2 border ${user?.plan === 'free' ? 'bg-slate-700/50 border-slate-600 text-slate-400' : 'bg-wood-900/40 border-wood-600 text-wood-400'}`}>
                                    <Icons.Shield className="w-4 h-4" /> Plano {user?.plan}
                                </div>
                            </div>
                        </div>
                        <div className="bg-slate-900/50 p-6 rounded-2xl border border-slate-700 w-full md:w-auto min-w-[300px]">
                            <h4 className="text-white font-bold text-sm mb-4 uppercase tracking-widest flex items-center gap-2">
                                <Icons.Zap className="w-4 h-4 text-wood-500" /> Assinatura Pro
                            </h4>
                            <button onClick={() => navigate('/pricing')} className="w-full bg-wood-600 hover:bg-wood-500 text-white py-3 rounded-xl font-bold shadow-lg transition-all">
                                {user?.plan === 'free' ? 'Contratar Agora' : 'Alterar Plano'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'company' && (
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 animate-fade-in space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="flex items-start gap-4">
                                <div className="w-24 h-24 bg-slate-900 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center relative overflow-hidden group">
                                    {profile.logo ? <img src={profile.logo} className="w-full h-full object-contain" /> : <Icons.Upload className="text-slate-600 w-6 h-6" />}
                                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'logo')} />
                                        <Icons.Edit className="text-white w-5 h-5" />
                                    </label>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white uppercase tracking-wider">Logotipo da Empresa</p>
                                    <p className="text-xs text-slate-500">Aparece no cabeçalho de orçamentos e contratos.</p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4">
                                <div className="w-24 h-24 bg-slate-900 border-2 border-dashed border-slate-600 rounded-lg flex items-center justify-center relative overflow-hidden group">
                                    {profile.signature ? <img src={profile.signature} className="w-full h-full object-contain" /> : <Icons.Edit className="text-slate-600 w-6 h-6" />}
                                    <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'signature')} />
                                        <Icons.Edit className="text-white w-5 h-5" />
                                    </label>
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white uppercase tracking-wider">Assinatura Digital</p>
                                    <p className="text-xs text-slate-500">Sua rubrica para o campo de assinatura no PDF.</p>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nome da Marcenaria</label>
                                <input value={profile.name} onChange={e => handleProfileChange('name', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white outline-none focus:border-wood-500" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">CNPJ / CPF</label>
                                <input value={profile.cnpj} onChange={e => handleProfileChange('cnpj', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white outline-none focus:border-wood-500" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Endereço Completo</label>
                                <input value={profile.address} onChange={e => handleProfileChange('address', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white outline-none focus:border-wood-500" />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Contato (Fone/Email)</label>
                                <input value={profile.contact} onChange={e => handleProfileChange('contact', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white outline-none focus:border-wood-500" />
                            </div>
                        </div>
                    </div>
                    <div className="flex justify-end pt-6 border-t border-slate-700">
                        <button onClick={handleSaveAll} disabled={!isDirty} className={`px-8 py-3 rounded-lg flex items-center gap-2 font-bold transition-all ${isDirty ? 'bg-wood-600 text-white shadow-lg' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
                            <Icons.Save className="w-5 h-5" /> Salvar Perfil
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'portal' && (
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 animate-fade-in space-y-8">
                    <div className="flex items-start gap-4 p-4 bg-wood-900/20 border border-wood-600/30 rounded-lg">
                        <Icons.Zap className="w-6 h-6 text-wood-500 mt-1" />
                        <div>
                            <h3 className="text-lg font-bold text-white">Identidade do Portal</h3>
                            <p className="text-slate-400 text-sm">Personalize como seus clientes verão os orçamentos. Essas informações aparecerão no link público.</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nome de Exibição</label>
                                <input
                                    value={profile.company_name || profile.name}
                                    onChange={e => handleProfileChange('company_name', e.target.value)}
                                    placeholder={profile.name}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white outline-none focus:border-wood-500"
                                />
                                <p className="text-[10px] text-slate-500 mt-1">Nome que aparecerá no topo do orçamento.</p>
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Cor Principal (Tema)</label>
                                <div className="flex gap-2 items-center">
                                    <input
                                        type="color"
                                        value={profile.company_color_primary || '#d97706'}
                                        onChange={e => handleProfileChange('company_color_primary', e.target.value)}
                                        className="h-10 w-20 bg-slate-900 border border-slate-700 rounded cursor-pointer"
                                    />
                                    <span className="text-slate-400 text-sm">{profile.company_color_primary || '#d97706'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">WhatsApp de Contato</label>
                                <input
                                    value={profile.company_phone || profile.contact}
                                    onChange={e => handleProfileChange('company_phone', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white outline-none focus:border-wood-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Email Público</label>
                                <input
                                    value={profile.company_email || ''}
                                    onChange={e => handleProfileChange('company_email', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white outline-none focus:border-wood-500"
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Site / Instagram</label>
                                <input
                                    value={profile.company_website || ''}
                                    onChange={e => handleProfileChange('company_website', e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded p-3 text-white outline-none focus:border-wood-500"
                                    placeholder="instagram.com/suamarcenaria"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-6 border-t border-slate-700">
                        <button onClick={handleSaveAll} disabled={!isDirty} className={`px-8 py-3 rounded-lg flex items-center gap-2 font-bold transition-all ${isDirty ? 'bg-wood-600 text-white shadow-lg' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
                            <Icons.Save className="w-5 h-5" /> Salvar Configurações
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'devices' && (
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 animate-fade-in">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-1">Aparelhos Vinculados</h3>
                            <p className="text-slate-400 text-sm">
                                Gerencie onde sua conta está ativa. Limite: <strong>{getDeviceLimit(user?.plan || 'free')}</strong>
                            </p>
                        </div>
                    </div>
                    <div className="space-y-3">
                        {user?.devices?.map(dev => (
                            <div key={dev.id} className={`p-4 rounded-lg border flex justify-between items-center ${dev.id === currentDeviceId ? 'bg-wood-900/20 border-wood-600/50' : 'bg-slate-900 border-slate-700'}`}>
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-full ${dev.id === currentDeviceId ? 'bg-wood-600 text-white' : 'bg-slate-800 text-slate-400'}`}>
                                        <Icons.Box className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-white text-sm">
                                            {dev.name} {dev.id === currentDeviceId && <span className="text-[10px] bg-wood-600 px-1.5 py-0.5 rounded ml-2 uppercase">Atual</span>}
                                        </h4>
                                        <p className="text-[10px] text-slate-500 uppercase">Visto em: {new Date(dev.lastAccess).toLocaleString()}</p>
                                    </div>
                                </div>
                                {dev.id !== currentDeviceId && (
                                    <button onClick={() => handleRemoveDevice(dev.id)} className="text-slate-500 hover:text-red-400 p-2"><Icons.Trash className="w-4 h-4" /></button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'sync' && (
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 animate-fade-in">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                                <Icons.Box className="w-5 h-5 text-wood-500" /> Backup e Sincronização
                            </h3>
                            <p className="text-slate-400 text-sm">Sincronize projetos, clientes e modelos de contrato com a nuvem.</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button onClick={handleCloudSync} disabled={syncLoading} className="p-6 bg-slate-900 border border-slate-700 rounded-xl hover:border-wood-600 transition-all text-left group">
                            <Icons.Upload className="w-8 h-8 text-wood-500 mb-3 group-hover:scale-110 transition-transform" />
                            <h4 className="font-bold text-white">Fazer Backup Agora</h4>
                        </button>
                        <button onClick={handleCloudPull} disabled={syncLoading} className="p-6 bg-slate-900 border border-slate-700 rounded-xl hover:border-blue-600 transition-all text-left group">
                            <Icons.Download className="w-8 h-8 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                            <h4 className="font-bold text-white">Restaurar da Nuvem</h4>
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'costs' && <FixedCosts />}
        </div>
    );
};

export default Settings;
