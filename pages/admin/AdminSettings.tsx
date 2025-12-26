import React from 'react';
import { Icons } from '../../components/Icon';
import { Button } from '../../components/ui/Button';

const AdminSettings: React.FC = () => {
    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">Configurações do Sistema</h2>
                    <p className="text-slate-500">Gerencie as configurações gerais da plataforma.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-wood-100 rounded-lg flex items-center justify-center text-wood-600">
                            <Icons.Shield className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Sistema</h3>
                            <p className="text-xs text-slate-500">Configurações globais</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm font-medium text-slate-700">Modo de Manutenção</span>
                            <div className="w-11 h-6 bg-slate-200 rounded-full relative cursor-pointer">
                                <div className="absolute left-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all" />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                            <span className="text-sm font-medium text-slate-700">Registros de Novos Usuários</span>
                            <div className="w-11 h-6 bg-green-500 rounded-full relative cursor-pointer">
                                <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600">
                            <Icons.Mail className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Notificações</h3>
                            <p className="text-xs text-slate-500">Alertas do sistema</p>
                        </div>
                    </div>
                    <div className="space-y-4">
                        <Button variant="outline" className="w-full justify-start">
                            <Icons.Send className="w-4 h-4 mr-2" />
                            Configurar Servidor SMTP
                        </Button>
                        <Button variant="outline" className="w-full justify-start">
                            <Icons.Message className="w-4 h-4 mr-2" />
                            Templates de E-mail
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminSettings;
