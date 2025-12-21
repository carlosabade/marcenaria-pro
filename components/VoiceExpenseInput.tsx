
import React, { useState, useEffect, useMemo } from 'react';
import { Icons } from './Icon';
import { parseVoiceCommand, VoiceCommandResult } from '../services/geminiService';
import { DailyExpense, ExpenseCategory, Appointment } from '../types';

interface VoiceExpenseInputProps {
  onSaveExpense: (expense: Omit<DailyExpense, 'id'>) => void;
  onSaveAppointment: (appointment: Omit<Appointment, 'id'>) => void;
}

const VoiceExpenseInput: React.FC<VoiceExpenseInputProps> = ({ onSaveExpense, onSaveAppointment }) => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  
  // State for result
  const [result, setResult] = useState<VoiceCommandResult | null>(null);

  // Browser Speech Recognition Support
  const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
  
  // Use useMemo to ensure the recognition instance remains stable across renders
  const recognition = useMemo(() => {
    return SpeechRecognition ? new SpeechRecognition() : null;
  }, []);

  useEffect(() => {
    if (recognition) {
      recognition.continuous = false;
      recognition.lang = 'pt-BR';
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const lastResult = event.results[event.results.length - 1];
        const text = lastResult[0].transcript;
        setTranscript(text);
        handleProcessText(text);
      };

      recognition.onend = () => {
        setIsListening(false);
      };
      
      recognition.onerror = (event: any) => {
        console.error("Speech error", event.error);
        setIsListening(false);
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recognition]); // Added recognition to dependencies, though it's memoized

  const toggleListening = () => {
    if (!recognition) {
      alert("Seu navegador não suporta reconhecimento de voz.");
      return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      setTranscript('');
      setResult(null);
      try {
          recognition.start();
          setIsListening(true);
      } catch (e) {
          console.error("Error starting recognition:", e);
          // If already started, stop it and try again or just stop status
          setIsListening(false);
      }
    }
  };

  const handleProcessText = async (text: string) => {
    setIsProcessing(true);
    const parsed = await parseVoiceCommand(text);
    setIsProcessing(false);
    
    if (parsed) {
      setResult(parsed);
    } else {
      alert("Não entendi. Tente falar: 'Gastei 50 reais em cola' ou 'Agendar visita amanhã às 14h'");
    }
  };

  const handleConfirm = () => {
    if (!result) return;

    if (result.type === 'expense') {
        onSaveExpense(result.data);
    } else if (result.type === 'appointment') {
        onSaveAppointment(result.data);
    }
    
    // Reset
    setResult(null);
    setTranscript('');
  };

  // --- RENDER HELPERS ---

  const renderExpenseForm = (data: any) => (
      <div className="grid grid-cols-2 gap-3 animate-fade-in">
        <div className="col-span-2">
            <label className="text-xs text-slate-500">Descrição do Gasto</label>
            <input 
            value={data.description}
            onChange={(e) => setResult({ type: 'expense', data: {...data, description: e.target.value} })}
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
            />
        </div>
        <div>
            <label className="text-xs text-slate-500">Valor (R$)</label>
            <input 
            type="number"
            value={data.amount}
            onChange={(e) => setResult({ type: 'expense', data: {...data, amount: Number(e.target.value)} })}
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
            />
        </div>
        <div>
            <label className="text-xs text-slate-500">Categoria</label>
            <select 
            value={data.category}
            onChange={(e) => setResult({ type: 'expense', data: {...data, category: e.target.value as ExpenseCategory} })}
            className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
            >
            {Object.values(ExpenseCategory).map(c => (
                <option key={c} value={c}>{c}</option>
            ))}
            </select>
        </div>
      </div>
  );

  const renderAppointmentForm = (data: any) => (
      <div className="grid grid-cols-1 gap-3 animate-fade-in">
          <div className="bg-wood-900/30 p-2 rounded border border-wood-800/50 mb-2 flex items-center gap-2">
              <Icons.Calendar className="text-wood-400 w-5 h-5" />
              <span className="text-sm text-wood-200">Novo Compromisso Detectado</span>
          </div>
          <div>
            <label className="text-xs text-slate-500">O que fazer?</label>
            <input 
                value={data.title}
                onChange={(e) => setResult({ type: 'appointment', data: {...data, title: e.target.value} })}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
             <div>
                <label className="text-xs text-slate-500">Data e Hora</label>
                <input 
                    type="datetime-local"
                    value={data.date ? data.date.slice(0, 16) : ''}
                    onChange={(e) => setResult({ type: 'appointment', data: {...data, date: new Date(e.target.value).toISOString()} })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white text-sm"
                />
             </div>
             <div>
                <label className="text-xs text-slate-500">Local (Opcional)</label>
                <input 
                    value={data.location || ''}
                    onChange={(e) => setResult({ type: 'appointment', data: {...data, location: e.target.value} })}
                    className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-white"
                />
             </div>
          </div>
      </div>
  );

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700">
      <h3 className="text-lg font-semibold text-wood-300 mb-4 flex items-center gap-2">
        <Icons.Mic className="w-5 h-5" />
        Comando de Voz (Gastos ou Agenda)
      </h3>

      {!result ? (
        <div className="flex flex-col items-center justify-center gap-4">
          <button
            onClick={toggleListening}
            className={`w-20 h-20 rounded-full flex items-center justify-center transition-all ${
              isListening 
                ? 'bg-red-500 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.5)]' 
                : 'bg-wood-600 hover:bg-wood-500 shadow-lg'
            }`}
          >
            <Icons.Mic className={`w-8 h-8 text-white ${isListening ? 'animate-bounce' : ''}`} />
          </button>
          
          <div className="text-slate-400 text-center text-sm">
            {isListening ? "Ouvindo... Toque para parar" : isProcessing ? "Processando com IA..." : "Toque para falar"}
            <br/>
            <div className="flex gap-4 justify-center mt-2 text-xs text-slate-500 italic">
                <span>"Gastei 120 de gasolina"</span>
                <span className="text-slate-700">|</span>
                <span>"Agendar visita amanhã às 14h"</span>
            </div>
          </div>
          
          {transcript && !isProcessing && (
            <div className="bg-slate-900 p-3 rounded-lg text-slate-300 text-sm italic w-full text-center">
              "{transcript}"
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          
          {result.type === 'expense' ? renderExpenseForm(result.data) : renderAppointmentForm(result.data)}
          
          <div className="flex gap-2 pt-2">
            <button 
              onClick={() => setResult(null)}
              className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium"
            >
              Cancelar
            </button>
            <button 
              onClick={handleConfirm}
              className="flex-1 py-2 rounded-lg bg-green-600 hover:bg-green-500 text-white font-medium flex justify-center items-center gap-2"
            >
              <Icons.Save className="w-4 h-4" /> 
              {result.type === 'expense' ? 'Salvar Gasto' : 'Agendar'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VoiceExpenseInput;
