
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CompanyProfile, AppSettings, UserProfile, ContractClause } from '../types';
import { getCompanyProfile, saveCompanyProfile, getSettings, saveSettings, getUser, logoutUser, syncToCloud, pullFromCloud, getLastSyncDate, getDeviceId, removeDevice, getDeviceLimit } from '../services/storageService';
import { Icons } from './Icon';
import FixedCosts from './FixedCosts';

const Settings: React.FC = () => {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'profile' | 'company' | 'contract' | 'costs' | 'sync' | 'devices'>('profile');
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
                <button onClick={() => setActiveTab('devices')} className={`pb-3 px-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'devices' ? 'text-wood-400 border-b-2 border-wood-500' : 'text-slate-400 hover:text-white'}`}>Dispositivos</button>
                <button onClick={() => setActiveTab('costs')} className={`pb-3 px-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'costs' ? 'text-wood-400 border-b-2 border-wood-500' : 'text-slate-400 hover:text-white'}`}>Custos & Oficina</button>
                <button onClick={() => setActiveTab('sync')} className={`pb-3 px-2 text-sm font-medium transition-colors whitespace-nowrap ${activeTab === 'sync' ? 'text-wood-400 border-b-2 border-wood-500' : 'text-slate-400 hover:text-white'}`}>Sincronização</button>
            </div>

            {activeTab === 'profile' && (
                <div className="animate-fade-in space-y-6">
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

            {activeTab === 'contract' && (
                <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 animate-fade-in space-y-6">
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-bold text-white">Modelo Padrão de Contrato</h3>
                            <p className="text-xs text-slate-400">Este modelo será copiado para todos os novos orçamentos.</p>
                        </div>
                        <button onClick={handleAddClause} className="bg-wood-600 hover:bg-wood-500 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg transition-all">
                            <Icons.Plus className="w-4 h-4" /> Adicionar Cláusula
                        </button>
                    </div>

                    <div className="space-y-4">
                        {profile.contractTemplate?.map((clause) => (
                            <div key={clause.id} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 group">
                                <div className="flex justify-between items-center mb-3">
                                    <input
                                        value={clause.title}
                                        onChange={(e) => handleUpdateClause(clause.id, 'title', e.target.value)}
                                        className="bg-transparent text-wood-400 font-bold uppercase text-xs border-b border-transparent focus:border-wood-500 outline-none w-2/3"
                                    />
                                    <button onClick={() => handleDeleteClause(clause.id)} className="text-slate-600 hover:text-red-500 transition-colors">
                                        <Icons.Trash className="w-4 h-4" />
                                    </button>
                                </div>
                                <textarea
                                    value={clause.text}
                                    onChange={(e) => handleUpdateClause(clause.id, 'text', e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm text-slate-300 outline-none focus:border-wood-500 min-h-[100px]"
                                    placeholder="Use tags como {{CLIENTE_NOME}}, {{VALOR_TOTAL}}, {{DESCRICAO_ITENS}}..."
                                />
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end pt-6 border-t border-slate-700">
                        <button onClick={handleSaveAll} disabled={!isDirty} className={`px-8 py-3 rounded-lg flex items-center gap-2 font-bold transition-all ${isDirty ? 'bg-wood-600 text-white shadow-lg' : 'bg-slate-700 text-slate-500 cursor-not-allowed'}`}>
                            <Icons.Save className="w-5 h-5" /> Salvar Modelo Padrão
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
