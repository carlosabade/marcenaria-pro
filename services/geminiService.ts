import { GoogleGenAI, Type } from "@google/genai";
import { ExpenseCategory } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Interfaces internas do parser
interface ExpenseData {
  description: string;
  amount: number;
  category: ExpenseCategory;
  date: string;
}

interface AppointmentData {
  title: string;
  date: string; // ISO String com Data e Hora
  location: string;
}

export type VoiceCommandResult = 
  | { type: 'expense', data: ExpenseData }
  | { type: 'appointment', data: AppointmentData }
  | null;

export const parseVoiceCommand = async (transcript: string): Promise<VoiceCommandResult> => {
  try {
    const now = new Date();
    const currentISO = now.toISOString();

    // Fix: Using 'gemini-3-flash-preview' for basic text command parsing per guidelines.
    const model = 'gemini-3-flash-preview';
    const prompt = `
      Você é um assistente para um marceneiro. Analise o texto falado e identifique se é um registro de GASTO (dinheiro) ou um AGENDAMENTO (compromisso/lembrete).
      
      Data/Hora atual de referência: ${currentISO} (Use isso para calcular "amanhã", "sexta-feira", etc. Se não houver hora especificada para agendamentos, assuma 08:00).

      Retorne um JSON com a seguinte estrutura:
      {
        "intent": "EXPENSE" ou "APPOINTMENT",
        "expenseDetails": {
           "description": "Resumo do item (ex: Cola)",
           "amount": 0.00,
           "category": "Material" | "Combustível" | "Alimentação" | "Ferramenta" | "Outros",
           "date": "YYYY-MM-DD"
        },
        "appointmentDetails": {
           "title": "Título do compromisso (ex: Instalar cozinha na Dona Maria)",
           "date": "YYYY-MM-DDTHH:mm:ss",
           "location": "Local ou Endereço (opcional)"
        }
      }

      Se for EXPENSE, preencha expenseDetails e deixe appointmentDetails null.
      Se for APPOINTMENT, preencha appointmentDetails e deixe expenseDetails null.

      Texto: "${transcript}"
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            intent: { type: Type.STRING, enum: ["EXPENSE", "APPOINTMENT"] },
            expenseDetails: {
                type: Type.OBJECT,
                properties: {
                    description: { type: Type.STRING },
                    amount: { type: Type.NUMBER },
                    category: { type: Type.STRING, enum: Object.values(ExpenseCategory) },
                    date: { type: Type.STRING }
                },
                nullable: true
            },
            appointmentDetails: {
                type: Type.OBJECT,
                properties: {
                    title: { type: Type.STRING },
                    date: { type: Type.STRING },
                    location: { type: Type.STRING }
                },
                nullable: true
            }
          },
          required: ["intent"]
        }
      }
    });

    if (response.text) {
      const result = JSON.parse(response.text);
      
      if (result.intent === 'EXPENSE' && result.expenseDetails) {
          return { type: 'expense', data: result.expenseDetails };
      } else if (result.intent === 'APPOINTMENT' && result.appointmentDetails) {
          return { type: 'appointment', data: result.appointmentDetails };
      }
    }
    return null;

  } catch (error) {
    console.error("Gemini parsing error:", error);
    return null;
  }
};