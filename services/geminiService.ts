import { GoogleGenAI, Type } from "@google/genai";
import { ExpenseCategory } from "../types";
import { getSettings } from "./storageService";

// Helper to get authenticated client dynamically
const DEFAULT_KEY = "AIzaSyCZQDSSHXMuC6otn7jLb384OEVF5Lr9ofg";

const getAI = () => {
  const settings = getSettings();
  // Prioritize settings, then env vars, then hardcoded fallback
  const apiKey = settings.googleApiKey || import.meta.env.VITE_GOOGLE_API_KEY || process.env.GEMINI_API_KEY || DEFAULT_KEY;

  if (!apiKey) {
    throw new Error("Chave de API não configurada. Configure em Ajustes > IA.");
  }
  return new GoogleGenAI({ apiKey });
};

// ... (Existing interfaces) ...

export type VoiceCommandResult =
  | { type: 'expense', data: ExpenseData }
  | { type: 'appointment', data: AppointmentData }
  | { type: 'error', message: string } // New error type
  | null;

export const parseVoiceCommand = async (transcript: string): Promise<VoiceCommandResult> => {
  try {
    const ai = getAI();
    // ... (Existing prompt setup) ...
    const now = new Date();
    const currentISO = now.toISOString();

    const model = 'gemini-1.5-flash'; // Reverting to stable 1.5 model for reliability
    const prompt = `
      Você é um assistente para um marceneiro. Analise o texto falado e identifique se é um registro de GASTO (dinheiro) ou um AGENDAMENTO (compromisso/lembrete).
      
      Data/Hora atual de referência: ${currentISO}
      
      Retorne um JSON:
      {
        "intent": "EXPENSE" | "APPOINTMENT",
        "expenseDetails": { ... },
        "appointmentDetails": { ... }
      }
      
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
    return { type: 'error', message: "Não entendi a intenção. Tente 'Gastei...' ou 'Agendar...'" };

  } catch (error: any) {
    console.error("Gemini parsing error:", error);
    // Return the actual error message to display to the user
    return { type: 'error', message: `Erro na IA: ${error.message || 'Falha de conexão'}` };
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