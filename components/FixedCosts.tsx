import React, { useState, useEffect } from 'react';
import { FixedCost, AppSettings } from '../types';
import { getFixedCosts, saveFixedCosts, getSettings, saveSettings, calculateHourlyRate } from '../services/storageService';
import { Icons } from './Icon';

const FixedCosts: React.FC = () => {
  const [costs, setCosts] = useState<FixedCost[]>([]);
  const [settings, setLocalSettings] = useState<AppSettings>(getSettings());
  const [newName, setNewName] = useState('');
  const [newAmount, setNewAmount] = useState('');

  // Editing State
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editAmount, setEditAmount] = useState('');

  // Save State
  const [isDirty, setIsDirty] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    setCosts(getFixedCosts());
    setLocalSettings(getSettings());
  }, []);

  // Removed auto-save useEffect

  const handleSettingsChange = (field: keyof AppSettings, value: number) => {
    setLocalSettings(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
    setShowSuccess(false);
  };

  const handleAdd = () => {
    if (!newName || !newAmount) return;
    const newCost: FixedCost = {
      id: Date.now().toString(),
      name: newName,
      amount: parseFloat(newAmount)
    };
    const updated = [...costs, newCost];
    setCosts(updated);
    setIsDirty(true);
    setShowSuccess(false);
    setNewName('');
    setNewAmount('');
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este custo?')) {
      const updated = costs.filter(c => c.id !== id);
      setCosts(updated);
      setIsDirty(true);
      setShowSuccess(false);
    }
  };

  // Edit Logic
  const startEditing = (cost: FixedCost) => {
    setEditingId(cost.id);
    setEditName(cost.name);
    setEditAmount(cost.amount.toString());
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName('');
    setEditAmount('');
  };

  const saveEdit = () => {
    if (!editName || !editAmount) return;
    
    const updated = costs.map(c => {
      if (c.id === editingId) {
        return { ...c, name: editName, amount: parseFloat(editAmount) };
      }
      return c;
    });

    setCosts(updated);
    setIsDirty(true);
    setShowSuccess(false);
    setEditingId(null);
  };

  const handleSaveAll = () => {
    const rate = calculateHourlyRate(costs, settings);
    const updatedSettings = { ...settings, hourlyRate: rate };
    
    saveSettings(updatedSettings);
    saveFixedCosts(costs);
    
    // Update local state to reflect calculated rate immediately if needed, 
    // though safeSettings usually handles persistence. 
    // We update local settings to ensure UI shows correct calculated rate if we used it from state.
    setLocalSettings(updatedSettings);

    setIsDirty(false);
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  const totalFixed = costs.reduce((sum, item) => sum + item.amount, 0);
  // Calculate potential rate for display based on current (unsaved) state
  const hourlyRate = calculateHourlyRate(costs, settings);

  return (
    <div className="space-y-6 relative">
      {showSuccess && (
        <div className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded shadow-xl animate-fade-in font-bold flex items-center gap-2">
           <Icons.Save className="w-5 h-5" /> Alterações salvas com sucesso!
        </div>
      )}

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <Icons.Settings className="w-6 h-6 text-wood-500" />
          Configurações da Oficina
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
             <label className="block text-sm text-slate-400 mb-1">Dias trabalhados/mês</label>
             <input 
               type="number" 
               value={settings.workingDaysPerMonth}
               onChange={(e) => handleSettingsChange('workingDaysPerMonth', Number(e.target.value))}
               className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white outline-none focus:border-wood-500"
             />
          </div>
          <div>
             <label className="block text-sm text-slate-400 mb-1">Horas trabalhadas/dia</label>
             <input 
               type="number" 
               value={settings.workingHoursPerDay}
               onChange={(e) => handleSettingsChange('workingHoursPerDay', Number(e.target.value))}
               className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white outline-none focus:border-wood-500"
             />
          </div>
        </div>

        <div className="bg-wood-900/30 border border-wood-800/50 p-4 rounded-lg flex justify-between items-center">
          <div>
            <p className="text-sm text-wood-300">Custo Fixo / Hora (Estimado)</p>
            <p className="text-2xl font-bold text-wood-400">R$ {hourlyRate.toFixed(2)}</p>
          </div>
          <div className="text-right">
             <p className="text-sm text-slate-400">Total Mensal</p>
             <p className="text-xl font-semibold text-white">R$ {totalFixed.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
        <h3 className="text-lg font-semibold text-white mb-4">Custos Fixos Mensais</h3>
        
        {/* Add New Row */}
        <div className="flex gap-2 mb-4">
          <input 
            placeholder="Novo custo (ex: Aluguel)" 
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            className="flex-1 bg-slate-900 border border-slate-700 rounded p-2 text-white outline-none focus:border-wood-500"
          />
          <input 
            type="number"
            placeholder="R$" 
            value={newAmount}
            onChange={(e) => setNewAmount(e.target.value)}
            className="w-24 bg-slate-900 border border-slate-700 rounded p-2 text-white outline-none focus:border-wood-500"
          />
          <button 
            onClick={handleAdd}
            className="bg-wood-600 hover:bg-wood-500 text-white p-2 rounded flex items-center justify-center w-10 transition-colors"
            title="Adicionar"
          >
            <Icons.Plus className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto no-scrollbar mb-6">
          {costs.map(cost => {
            const isEditing = editingId === cost.id;

            return (
              <div key={cost.id} className={`flex justify-between items-center p-3 rounded border transition-colors ${isEditing ? 'bg-slate-700 border-wood-500' : 'bg-slate-900 border-slate-800 hover:border-slate-600'}`}>
                {isEditing ? (
                  // Editing Mode
                  <>
                    <div className="flex-1 flex gap-2 mr-2">
                       <input 
                          value={editName}
                          onChange={e => setEditName(e.target.value)}
                          className="flex-1 bg-slate-800 border border-slate-600 rounded p-1 text-white text-sm outline-none focus:border-wood-500"
                          autoFocus
                       />
                       <input 
                          type="number"
                          value={editAmount}
                          onChange={e => setEditAmount(e.target.value)}
                          className="w-24 bg-slate-800 border border-slate-600 rounded p-1 text-white text-sm outline-none focus:border-wood-500"
                       />
                    </div>
                    <div className="flex items-center gap-1">
                      <button 
                        onClick={saveEdit}
                        className="text-green-400 hover:text-green-300 p-1 bg-slate-800 rounded"
                        title="Salvar Alteração"
                      >
                        <Icons.Save className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={cancelEdit}
                        className="text-slate-400 hover:text-slate-200 p-1 bg-slate-800 rounded"
                        title="Cancelar"
                      >
                        <Icons.Close className="w-4 h-4" />
                      </button>
                    </div>
                  </>
                ) : (
                  // Display Mode
                  <>
                    <span className="text-slate-200">{cost.name}</span>
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-wood-300">R$ {cost.amount.toFixed(2)}</span>
                      <div className="flex gap-1">
                        <button 
                            onClick={() => startEditing(cost)}
                            className="text-slate-400 hover:text-white p-1"
                            title="Editar"
                        >
                            <Icons.Edit className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => handleDelete(cost.id)}
                            className="text-red-400 hover:text-red-300 p-1"
                            title="Excluir"
                        >
                            <Icons.Trash className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            );
          })}
          {costs.length === 0 && (
            <p className="text-center text-slate-500 py-4">Nenhum custo fixo cadastrado.</p>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-slate-700">
            <button 
              onClick={handleSaveAll}
              className={`${
                isDirty 
                  ? 'bg-wood-600 hover:bg-wood-500 animate-pulse' 
                  : 'bg-slate-700 hover:bg-slate-600'
              } text-white px-6 py-3 rounded-lg flex items-center gap-2 font-bold shadow-lg transition-colors`}
            >
              <Icons.Save className="w-5 h-5" /> 
              {isDirty ? 'Salvar Custos e Configurações' : 'Tudo Salvo'}
            </button>
        </div>
      </div>
    </div>
  );
};

export default FixedCosts;