import { GoogleGenAI, Type } from "@google/genai";
import { ExpenseCategory } from "../types";
import { getSettings } from "./storageService";

// Helper to get authenticated client dynamically
const getAI = () => {
  const settings = getSettings();
  const apiKey = settings.googleApiKey || import.meta.env.VITE_GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error("Chave de API não configurada. Configure em Ajustes > IA.");
  }
  return new GoogleGenAI({ apiKey });
};

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
    const ai = getAI();
    const now = new Date();
    const currentISO = now.toISOString();

    const model = 'gemini-2.0-flash'; // Upgrade to fast 2.0 model if available, otherwise fallback handles it.
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

export const generateImageFromSketch = async (sketchBase64: string, prompt: string): Promise<string> => {
  const settings = getSettings();
  const rawKey = settings.googleApiKey || import.meta.env.VITE_GOOGLE_API_KEY || process.env.GEMINI_API_KEY;
  const apiKey = rawKey ? rawKey.trim() : "";

  if (!apiKey) {
    throw new Error("Chave de API não configurada.");
  }

  // Debug Log (Masked)
  console.log(`API Key carregada: ${apiKey.substring(0, 4)}... (Length: ${apiKey.length})`);

  // Hardcoded Reliability List
  // We explicitly mix v1beta (for 1.5) and v1 (for 1.0) logic below
  const attempts = [
    { model: 'gemini-1.5-flash', version: 'v1beta' },
    { model: 'gemini-1.5-flash-latest', version: 'v1beta' },
    { model: 'gemini-1.5-pro', version: 'v1beta' },
    { model: 'gemini-pro', version: 'v1' }, // Fallback to classic
  ];

  let lastError;
  const base64Data = sketchBase64.replace(/^data:image\/[a-z]+;base64,/, "");

  for (const { model, version } of attempts) {
    try {
      console.log(`Tentando renderizar: ${model} (${version}) ...`);

      const renderPrompt = `
        You are an expert Architectural Visualizer.
        
        TASK:
        Turn the attached sketch into a **High-Fidelity Technical Illustration** (SVG format).
        
        INPUT CONTEXT:
        Description: "${prompt}"
        
        INSTRUCTIONS:
        1. **STRICTLY FOLLOW THE GEOMETRY** of the sketch.
        2. **STYLE**: Solid colors, slight gradients for 3D depth, isometric/perspective view.
        3. **DETAILS**: Add handles, cabinet gaps, countertops.
        4. **OUTPUT**: VALID SVG CODE ONLY. Start with <svg ...>.
        5. **BACKGROUND**: Solid white <rect width="100%" height="100%" fill="white" />.
        
        Return ONLY the raw SVG string.
      `;

      // Construct URL based on version requirement
      const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${apiKey}`;

      const payload = {
        contents: [{
          parts: [
            { text: renderPrompt },
            { inlineData: { mimeType: "image/png", data: base64Data } }
          ]
        }]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        console.warn(`Erro na API (${model}):`, errData);

        if (response.status === 404) {
          console.warn(`Modelo ${model} não encontrado (404).`);
          continue;
        }

        if (response.status === 429) {
          console.warn(`Limite excedido para ${model} (429), tentando próximo...`);
          continue;
        }

        throw new Error(`Erro ${response.status}: ${errData.error?.message || response.statusText}`);
      }

      const data = await response.json();
      let svgText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Clean up markdown if present
      if (svgText.includes('```')) {
        svgText = svgText.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '');
      }

      // Validate SVG
      if (svgText.trim().startsWith('<svg') && svgText.includes('</svg>')) {
        console.log(`Render gerado com sucesso via ${model}`);
        // Safe Base64 encoding for UTF-8 (emojis, accents, etc)
        const encodedSvg = btoa(unescape(encodeURIComponent(svgText)));
        return `data:image/svg+xml;base64,${encodedSvg}`;
      }

    } catch (error: any) {
      console.warn(`Falha na tentativa com ${model}:`, error.message);
      lastError = error;
    }
  }

  console.error("Todas as tentativas de renderização falharam.", lastError);
  throw new Error("Não foi possível conectar à IA. Verifique se sua Chave API em Ajustes está correta e ativa.");
};