
import React, { useEffect, useState } from 'react';
import { ResponsiveContainer, PieChart, Pie, Tooltip, Cell } from 'recharts';
import { getExpenses, getProjects, addExpense, getFixedCosts, getSettings, calculateProjectFinancials, getAppointments, addAppointment, deleteAppointment, calculateHourlyRate } from '../services/storageService';
import { DailyExpense, Project, FixedCost, AppSettings, Appointment } from '../types';
import VoiceExpenseInput from './VoiceExpenseInput';
import { Icons } from './Icon';
import SubscriptionStatus from './SubscriptionStatus';
import { useSubscription } from '../hooks/useSubscription';

const Dashboard: React.FC = () => {
  const [expenses, setExpenses] = useState<DailyExpense[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [fixedCosts, setFixedCosts] = useState<FixedCost[]>([]);
  const [settings, setSettings] = useState<AppSettings>(getSettings());
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  // Subscription hook
  const subscription = useSubscription();

  const refreshData = () => {
    setExpenses(getExpenses());
    setProjects(getProjects());
    setFixedCosts(getFixedCosts());
    setSettings(getSettings());
    setAppointments(getAppointments());
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  const handleAddExpense = (newExpense: Omit<DailyExpense, 'id'>) => {
    addExpense({ ...newExpense, id: Date.now().toString() });
    refreshData();
  };

  const handleAddAppointment = (newApp: Omit<Appointment, 'id'>) => {
    addAppointment({ ...newApp, id: Date.now().toString() });
    refreshData();
    alert('Compromisso agendado com sucesso!');
  };

  const handleDeleteAppointment = (id: string) => {
    if (window.confirm("Concluir ou excluir este compromisso?")) {
      deleteAppointment(id);
      refreshData();
    }
  };

  // Stats Calculation
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthlyExpenses = expenses.filter(e => {
    const d = new Date(e.date);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  });

  const totalMonthlyVariable = monthlyExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalMonthlyFixed = fixedCosts.reduce((acc, curr) => acc + curr.amount, 0);
  const totalMonthlyCost = totalMonthlyVariable + totalMonthlyFixed;

  const hourlyRate = calculateHourlyRate(fixedCosts, settings);
  const activeProjectsCount = projects.filter(p => p.status === 'active').length;

  // CÁLCULO DE RECEITA E TERMÔMETRO
  const currentMonthProjects = projects.filter(p => {
    const d = new Date(p.startDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear && p.status !== 'quote';
  });

  const totalRevenue = currentMonthProjects.reduce((sum, p) => {
    const effectiveSettings = { ...settings, hourlyRate };
    const financials = calculateProjectFinancials(p, effectiveSettings);
    return sum + financials.suggestedPrice;
  }, 0);

  const breakEvenPoint = totalMonthlyCost;
  const financialGap = breakEvenPoint - totalRevenue;
  const isLoss = totalRevenue < breakEvenPoint;

  let percentage = 0;
  if (breakEvenPoint > 0) {
    percentage = (totalRevenue / breakEvenPoint) * 100;
  } else if (totalRevenue > 0) {
    percentage = 100;
  }

  // Safe default for styling
  const barWidth = isNaN(percentage) ? 0 : Math.min(percentage, 100);

  // Chart Data Preparation
  const categoryData = monthlyExpenses.reduce((acc: any, curr) => {
    const existing = acc.find((a: any) => a.name === curr.category);
    if (existing) {
      existing.value += curr.amount;
    } else {
      acc.push({ name: curr.category, value: curr.amount });
    }
    return acc;
  }, []);

  const COLORS = ['#cc7633', '#bf5d29', '#9f4623', '#823a23', '#69311f'];

  // Upcoming Appointments
  const upcomingAppointments = appointments
    .filter(a => new Date(a.date) >= new Date(Date.now() - 86400000))
    .slice(0, 3);

  // --- LOGICA DO CRONOGRAMA ---
  const timelineProjects = projects
    .filter(p => p.status === 'active' && p.deadline)
    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  const getTimelineStats = (start: string, end: string) => {
    const startDate = new Date(start).getTime();
    const endDate = new Date(end).getTime();
    const now = new Date().getTime();

    const totalDuration = endDate - startDate;
    const elapsed = now - startDate;

    let percent = 0;
    if (totalDuration > 0) {
      percent = (elapsed / totalDuration) * 100;
    } else if (now > endDate) {
      percent = 100;
    }

    percent = Math.max(0, Math.min(100, percent));

    const diffMs = endDate - now;
    const daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    return { percent, daysRemaining };
  };

  if (loading) return <div className="text-white p-6">Carregando painel...</div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <SubscriptionStatus />
      {/* --- TERMÔMETRO FINANCEIRO --- */}
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-xl border border-slate-700 shadow-xl relative overflow-hidden">
        <div className="flex justify-between items-center mb-6 relative z-10">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Icons.Chart className="w-6 h-6 text-wood-500" />
              Termômetro do Mês
            </h2>
            <p className="text-sm text-slate-400">Ponto de Equilíbrio vs. Vendas Confirmadas</p>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase text-slate-500">Resultado Atual</p>
            <p className={`text-2xl font-bold ${isLoss ? 'text-red-500' : 'text-green-500'}`}>
              {isLoss ? 'PREJUÍZO' : 'LUCRO'}
            </p>
          </div>
        </div>

        {/* Barra de Progresso Visual */}
        <div className="relative h-12 bg-slate-950 rounded-full mb-4 border border-slate-700 shadow-inner">
          <div
            className={`h-full rounded-full transition-all duration-1000 flex items-center justify-end pr-3 ${percentage < 50 ? 'bg-red-600' :
              percentage < 100 ? 'bg-yellow-600' :
                'bg-green-600'
              }`}
            style={{ width: `${Math.max(barWidth, 5)}%` }}
          >
            <span className="text-white font-bold text-sm drop-shadow-md">{percentage.toFixed(0)}%</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative z-10 text-center md:text-left">
          <div className="bg-black/20 rounded p-3 border border-slate-700/50">
            <p className="text-xs text-slate-400 uppercase mb-1">Custo Total (Meta Mínima)</p>
            <p className="text-xl font-mono font-bold text-white">R$ {totalMonthlyCost.toFixed(2)}</p>
            <p className="text-[10px] text-slate-500">Fixo + Variável</p>
          </div>

          <div className="bg-black/20 rounded p-3 border border-slate-700/50">
            <p className="text-xs text-slate-400 uppercase mb-1">Vendas (Projetos Inic.)</p>
            <p className={`text-xl font-mono font-bold ${isLoss ? 'text-yellow-500' : 'text-green-400'}`}>R$ {totalRevenue.toFixed(2)}</p>
            <p className="text-[10px] text-slate-500">Mês Atual</p>
          </div>

          <div className="bg-black/20 rounded p-3 border border-slate-700/50 flex flex-col justify-center">
            {isLoss ? (
              <>
                <p className="text-xs text-red-400 uppercase font-bold mb-1">Falta Vender</p>
                <p className="text-xl font-mono font-bold text-red-400">R$ {Math.abs(financialGap).toFixed(2)}</p>
                <p className="text-[10px] text-red-300/70">Para pagar as contas</p>
              </>
            ) : (
              <>
                <p className="text-xs text-green-400 uppercase font-bold mb-1">Saldo Positivo</p>
                <p className="text-xl font-mono font-bold text-green-400">+ R$ {Math.abs(financialGap).toFixed(2)}</p>
                <p className="text-[10px] text-green-300/70">Parabéns!</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-xs uppercase font-bold mb-1">Gasto no Mês</p>
          <h3 className="text-2xl font-bold text-white">R$ {totalMonthlyCost.toFixed(0)}</h3>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-xs uppercase font-bold mb-1">Projetos Ativos</p>
          <h3 className="text-2xl font-bold text-wood-400">{activeProjectsCount}</h3>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-xs uppercase font-bold mb-1">Custo Hora</p>
          <h3 className="text-2xl font-bold text-white">R$ {hourlyRate.toFixed(2)}</h3>
        </div>
        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
          <p className="text-slate-400 text-xs uppercase font-bold mb-1">Custo Fixo</p>
          <h3 className="text-2xl font-bold text-slate-300">R$ {totalMonthlyFixed.toFixed(0)}</h3>
        </div>
      </div>

      {/* --- CRONOGRAMA VISUAL DE PRODUÇÃO --- */}
      {timelineProjects.length > 0 ? (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg">
          <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
            <Icons.Calendar className="w-5 h-5 text-wood-500" />
            Cronograma de Produção
          </h3>
          <div className="space-y-6">
            {timelineProjects.map(project => {
              const { percent, daysRemaining } = getTimelineStats(project.startDate, project.deadline);

              let statusColor = "bg-wood-600";
              let statusText = "text-wood-400";
              let daysText = `${daysRemaining} dias restantes`;

              if (daysRemaining < 0) {
                statusColor = "bg-red-600";
                statusText = "text-red-400";
                daysText = `Atrasado ${Math.abs(daysRemaining)} dias`;
              } else if (daysRemaining <= 3) {
                statusColor = "bg-orange-500";
                statusText = "text-orange-400";
                daysText = daysRemaining === 0 ? "Entrega Hoje!" : `Entrega em ${daysRemaining} dias`;
              } else if (daysRemaining > 30) {
                statusColor = "bg-green-600";
                statusText = "text-green-400";
              }

              return (
                <div key={project.id} className="relative">
                  <div className="flex justify-between items-end mb-2">
                    <div>
                      <h4 className="font-bold text-white text-sm">{project.clientName}</h4>
                      <p className="text-xs text-slate-400">{project.projectType}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold ${statusText} uppercase`}>{daysText}</p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(project.startDate).toLocaleDateString().slice(0, 5)} até {new Date(project.deadline).toLocaleDateString().slice(0, 5)}
                      </p>
                    </div>
                  </div>

                  <div className="w-full h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-700 relative">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${statusColor}`}
                      style={{ width: `${percent}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 shadow-lg text-center opacity-70">
          <h3 className="text-lg font-semibold text-white mb-2">Cronograma Vazio</h3>
          <p className="text-sm text-slate-400">Adicione um projeto e defina uma data de entrega para vê-lo aqui.</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Action Area */}
        <div className="lg:col-span-2 space-y-6">
          <VoiceExpenseInput onSaveExpense={handleAddExpense} onSaveAppointment={handleAddAppointment} />

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Icons.Wallet className="w-5 h-5" />
              Gastos Recentes
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left text-slate-400">
                <thead className="text-xs text-slate-500 uppercase bg-slate-900/50">
                  <tr>
                    <th className="px-4 py-3 rounded-l-lg">Data</th>
                    <th className="px-4 py-3">Descrição</th>
                    <th className="px-4 py-3">Categoria</th>
                    <th className="px-4 py-3 rounded-r-lg text-right">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.slice(0, 5).map(expense => (
                    <tr key={expense.id} className="border-b border-slate-700/50 hover:bg-slate-700/20">
                      <td className="px-4 py-3">{new Date(expense.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 font-medium text-white">{expense.description}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs bg-slate-700 text-slate-300 border border-slate-600">
                          {expense.category}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right text-wood-400 font-mono">
                        R$ {expense.amount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                  {expenses.length === 0 && (
                    <tr>
                      <td colSpan={4} className="text-center py-6 text-slate-500">
                        Nenhum gasto registrado. Use o microfone acima!
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Charts Side */}
        <div className="space-y-6">
          {/* UPCOMING APPOINTMENTS */}
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Icons.Calendar className="w-5 h-5 text-wood-500" />
              Agenda Próxima
            </h3>
            <div className="space-y-3">
              {upcomingAppointments.length > 0 ? upcomingAppointments.map(app => (
                <div key={app.id} className="bg-slate-900 p-3 rounded-lg border border-slate-700 flex justify-between items-start group">
                  <div>
                    <p className="text-white font-medium text-sm">{app.title}</p>
                    <div className="flex gap-2 text-xs text-slate-400 mt-1">
                      <span>{new Date(app.date).toLocaleDateString()}</span>
                      <span>{new Date(app.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                    {app.location && <p className="text-xs text-wood-400 mt-1">{app.location}</p>}
                  </div>
                  <button onClick={() => handleDeleteAppointment(app.id)} className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-green-500 transition-opacity" title="Concluir/Remover">
                    <Icons.Close className="w-4 h-4" />
                  </button>
                </div>
              )) : (
                <p className="text-slate-500 text-sm italic text-center py-4">Nenhum compromisso agendado.</p>
              )}
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 h-80 flex flex-col">
            <h3 className="text-lg font-semibold text-white mb-2">Gastos por Categoria</h3>
            <div className="flex-1 w-full min-h-0">
              {categoryData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: number) => `R$ ${value.toFixed(2)}`}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-sm border-2 border-dashed border-slate-700 rounded-xl">
                  <Icons.Chart className="w-10 h-10 mb-2 opacity-20" />
                  <p>Sem dados para gráfico</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
