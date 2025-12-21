
import React, { useState, useEffect } from 'react';
import { Client, Project } from '../types';
import { getClients, updateClient, deleteClient, getProjects } from '../services/storageService';
import { Icons } from './Icon';
import { Button } from './ui/Button';
import { Input, TextArea } from './ui/Input';
import { Card } from './ui/Card';
import { useSubscription } from '../hooks/useSubscription';
import { UpgradePrompt } from './UpgradePrompt';

const Clients: React.FC = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [projects, setProjects] = useState<Project[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<Partial<Client>>({});

    // Estado para visualização de detalhes
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);
    const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

    // Subscription hook
    const subscription = useSubscription();

    useEffect(() => {
        refreshData();
    }, []);

    const refreshData = () => {
        setClients(getClients());
        setProjects(getProjects());
    };

    const handleEdit = (client: Client) => {
        setEditingId(client.id);
        setForm({ ...client });
        setSelectedClient(null);
    };

    const handleNew = () => {
        // Check client limit
        if (!subscription.canAddClient(clients.length)) {
            setShowUpgradePrompt(true);
            return;
        }

        setEditingId('new');
        setForm({
            name: '',
            phone: '',
            email: '',
            address: '',
            cpf: '',
            notes: ''
        });
        setSelectedClient(null);
    };

    const handleSave = () => {
        if (!form.name || !form.phone) {
            alert("Nome e Telefone são obrigatórios!");
            return;
        }

        const newClient: Client = {
            id: editingId === 'new' ? Date.now().toString() : (editingId as string),
            name: form.name || '',
            phone: form.phone || '',
            email: form.email || '',
            address: form.address || '',
            cpf: form.cpf || '',
            notes: form.notes || ''
        };

        updateClient(newClient);
        refreshData();
        setEditingId(null);
    };

    const handleDelete = (id: string) => {
        if (confirm('Tem certeza que deseja remover este cliente?')) {
            deleteClient(id);
            refreshData();
            if (selectedClient?.id === id) setSelectedClient(null);
        }
    };

    const handleSelectClient = (client: Client) => {
        if (editingId) return; // Não seleciona se estiver editando
        setSelectedClient(client);
    };

    const getClientHistory = (clientName: string, clientCpf?: string) => {
        // Busca projetos por nome aproximado ou CPF exato
        return projects.filter(p => {
            const nameMatch = p.clientName.toLowerCase().includes(clientName.toLowerCase());
            const cpfMatch = clientCpf && p.clientCpf === clientCpf;
            return nameMatch || cpfMatch;
        });
    };

    const filteredClients = clients.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.phone.includes(searchTerm)
    );

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    // --- RENDERIZAR DETALHES E HISTÓRICO ---
    if (selectedClient) {
        const history = getClientHistory(selectedClient.name, selectedClient.cpf);

        return (
            <div className="space-y-6 animate-fade-in pb-20"> {/* Add padding bottom for mobile */}
                <div className="flex items-center gap-2 mb-4 pt-2"> {/* Added pt-2 */}
                    <Button variant="ghost" onClick={() => setSelectedClient(null)} className="pl-0 gap-1">
                        <Icons.ChevronRight className="w-4 h-4 rotate-180" /> Voltar
                    </Button>
                    <h2 className="text-xl font-bold text-white">Detalhes do Cliente</h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Cartão de Info */}
                    <Card className="h-fit">
                        <div className="flex justify-between items-start mb-4">
                            <div className="bg-wood-600 w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold text-white shadow-lg">
                                {selectedClient.name.charAt(0).toUpperCase()}
                            </div>
                            <Button variant="ghost" size="sm" onClick={() => handleEdit(selectedClient)}>
                                <Icons.Edit className="w-5 h-5" />
                            </Button>
                        </div>

                        <h3 className="text-2xl font-bold text-white mb-1">{selectedClient.name}</h3>
                        <p className="text-slate-400 text-sm mb-6 flex items-center gap-2">
                            <Icons.Phone className="w-4 h-4 text-wood-500" /> {selectedClient.phone}
                        </p>

                        <div className="space-y-3 text-sm text-slate-300">
                            {selectedClient.email && (
                                <div className="flex items-center gap-3 p-2 bg-slate-900 rounded">
                                    <Icons.Mail className="w-4 h-4 text-slate-500" />
                                    <span className="truncate">{selectedClient.email}</span>
                                </div>
                            )}
                            {selectedClient.address && (
                                <div className="flex items-center gap-3 p-2 bg-slate-900 rounded">
                                    <Icons.Building className="w-4 h-4 text-slate-500" />
                                    <span>{selectedClient.address}</span>
                                </div>
                            )}
                            {selectedClient.notes && (
                                <div className="mt-4 p-3 bg-wood-900/20 border border-wood-900/50 rounded italic text-slate-400">
                                    "{selectedClient.notes}"
                                </div>
                            )}
                        </div>

                        <div className="mt-6 pt-6 border-t border-slate-700 grid grid-cols-2 gap-2">
                            <a href={`https://wa.me/55${selectedClient.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 text-white py-2 rounded-lg font-bold text-sm transition-colors">
                                <Icons.Message className="w-4 h-4" /> WhatsApp
                            </a>
                            <a href={`tel:${selectedClient.phone}`} className="flex items-center justify-center gap-2 bg-slate-700 hover:bg-slate-600 text-white py-2 rounded-lg font-bold text-sm transition-colors">
                                <Icons.Phone className="w-4 h-4" /> Ligar
                            </a>
                        </div>
                    </Card>

                    {/* Histórico de Projetos */}
                    <Card className="md:col-span-2">
                        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                            <Icons.History className="w-5 h-5 text-wood-500" /> Histórico de Projetos ({history.length})
                        </h3>

                        {history.length > 0 ? (
                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {history.map(proj => (
                                    <div key={proj.id} className="bg-slate-900 p-4 rounded-lg border border-slate-700 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 hover:border-slate-500 transition-colors">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-white">{proj.projectType}</h4>
                                                <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${proj.status === 'completed' ? 'bg-green-900 text-green-300' :
                                                    proj.status === 'active' ? 'bg-blue-900 text-blue-300' :
                                                        proj.status === 'quote' ? 'bg-yellow-900 text-yellow-300' :
                                                            'bg-purple-900 text-purple-300'
                                                    }`}>
                                                    {proj.status === 'quote' ? 'Orçamento' : proj.status === 'active' ? 'Em Produção' : proj.status === 'completed' ? 'Entregue' : 'Pendente'}
                                                </span>
                                            </div>
                                            <p className="text-xs text-slate-400">Entrega: {proj.deadline ? new Date(proj.deadline).toLocaleDateString() : 'N/D'}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs text-slate-500 uppercase">Custo Material</p>
                                            <p className="text-wood-400 font-mono font-bold">{formatCurrency(proj.materialsCost)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-10 text-slate-500 bg-slate-900/50 rounded-lg border border-dashed border-slate-700">
                                <p>Nenhum projeto encontrado para este cliente.</p>
                                <p className="text-xs mt-1">Certifique-se que o nome no projeto seja "{selectedClient.name}"</p>
                            </div>
                        )}
                    </Card>
                </div>
            </div>
        );
    }

    // --- RENDERIZAR FORMULÁRIO ---
    if (editingId) {
        return (
            <div className="max-w-2xl mx-auto animate-fade-in pb-20">
                <Card>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                            <Icons.UserPlus className="w-6 h-6 text-wood-500" />
                            {editingId === 'new' ? 'Novo Cliente' : 'Editar Cliente'}
                        </h2>
                        <Button variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                            <Icons.Close className="w-5 h-5" />
                        </Button>
                    </div>

                    <div className="space-y-4">
                        <Input
                            label="Nome Completo *"
                            placeholder="Ex: Maria Silva"
                            value={form.name}
                            onChange={e => setForm({ ...form, name: e.target.value })}
                        />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Input
                                label="Telefone / WhatsApp *"
                                placeholder="(00) 00000-0000"
                                value={form.phone}
                                onChange={e => setForm({ ...form, phone: e.target.value })}
                            />
                            <Input
                                label="CPF / CNPJ"
                                placeholder="000.000.000-00"
                                value={form.cpf}
                                onChange={e => setForm({ ...form, cpf: e.target.value })}
                            />
                        </div>

                        <Input
                            label="Email"
                            placeholder="cliente@email.com"
                            value={form.email}
                            onChange={e => setForm({ ...form, email: e.target.value })}
                        />

                        <Input
                            label="Endereço Completo"
                            placeholder="Rua, Número, Bairro, Cidade..."
                            value={form.address}
                            onChange={e => setForm({ ...form, address: e.target.value })}
                        />

                        <TextArea
                            label="Observações"
                            placeholder="Preferências, horários de contato, etc."
                            rows={3}
                            value={form.notes}
                            onChange={e => setForm({ ...form, notes: e.target.value })}
                        />

                        <div className="flex justify-end gap-3 pt-4 border-t border-slate-700 mt-4">
                            <Button
                                variant="secondary"
                                onClick={() => setEditingId(null)}
                            >
                                Cancelar
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleSave}
                            >
                                <Icons.Save className="w-4 h-4 mr-2" /> Salvar Cliente
                            </Button>
                        </div>
                    </div>
                </Card>
            </div>
        );
    }

    // --- RENDERIZAR LISTA ---
    return (
        <>
            <UpgradePrompt
                isOpen={showUpgradePrompt}
                onClose={() => setShowUpgradePrompt(false)}
                feature="clients"
                currentCount={clients.length}
                limit={subscription.getClientLimit()}
            />

            <div className="space-y-6 animate-fade-in pb-20">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                            <Icons.Users className="w-6 h-6 text-wood-500" /> Carteira de Clientes
                        </h2>
                        {!subscription.isPaid && (
                            <p className="text-xs text-slate-500 mt-1">
                                {clients.length} / {subscription.getClientLimit()} clientes cadastrados
                            </p>
                        )}
                    </div>
                    <div className="flex w-full md:w-auto gap-2">
                        <Input
                            placeholder="Buscar por nome ou telefone..."
                            className="flex-1 md:w-64"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                        <Button onClick={handleNew} className="whitespace-nowrap">
                            <Icons.Plus className="w-5 h-5 md:mr-2" /> <span className="hidden md:inline">Novo Cliente</span>
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredClients.map(client => (
                        <Card
                            key={client.id}
                            onClick={() => handleSelectClient(client)}
                            className="hover:border-wood-600 transition-all hover:shadow-lg cursor-pointer group relative p-5"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-700 flex items-center justify-center text-wood-400 font-bold">
                                        {client.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-white group-hover:text-wood-400 transition-colors">{client.name}</h3>
                                        <p className="text-xs text-slate-400">{client.phone}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="text-sm text-slate-400 mb-4 line-clamp-2 min-h-[2.5em]">
                                {client.notes || <span className="italic text-slate-600">Sem observações.</span>}
                            </div>

                            <div className="flex border-t border-slate-700 pt-3 gap-2">
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); handleEdit(client); }}
                                    className="flex-1"
                                >
                                    Editar
                                </Button>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={(e) => { e.stopPropagation(); handleDelete(client.id); }}
                                    className="text-red-400 hover:text-red-300 hover:bg-red-900/30"
                                >
                                    <Icons.Trash className="w-4 h-4" />
                                </Button>
                            </div>
                        </Card>
                    ))}

                    {filteredClients.length === 0 && (
                        <div className="col-span-full py-16 text-center text-slate-500 bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-700">
                            <Icons.Users className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p>Nenhum cliente encontrado.</p>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
};

export default Clients;
