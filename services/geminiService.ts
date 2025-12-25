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
  try {
    const settings = getSettings();
    const apiKey = settings.googleApiKey || import.meta.env.VITE_GOOGLE_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error("Chave de API não encontrada.");
    }

    const model = 'imagen-3.0-generate-002';

    // Using raw REST API to avoid SDK version mismatches
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:predict?key=${apiKey}`;

    const payload = {
      instances: [
        { prompt: `Furniture design, realistic, ${prompt}. High quality photorealistic render on white background.` }
      ],
      parameters: {
        sampleCount: 1,
        aspectRatio: "4:3"
      }
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error("Gemini API Error:", errData);
      throw new Error(errData.error?.message || `Erro API: ${response.status}`);
    }

    const data = await response.json();

    // Response format for Imagen on Vertex/Gemini usually:
    // { predictions: [ { bytesBase64Encoded: "..." } ] }

    const base64Image = data.predictions?.[0]?.bytesBase64Encoded;

    if (base64Image) {
      return `data:image/png;base64,${base64Image}`;
    }

    throw new Error("Nenhuma imagem retornada pela API.");

  } catch (error: any) {
    console.warn("Imagen API failed, falling back to SVG generation...", error);

    // Tentativa de diagnóstico automático apenas para log
    try {
      const settings = getSettings();
      const apiKey = settings.googleApiKey || import.meta.env.VITE_GOOGLE_API_KEY;
      if (apiKey) {
        const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        const listData = await listResp.json();
        const imageModels = listData.models
          ?.filter((m: any) => m.name.includes('image') || m.name.includes('generate'))
          ?.map((m: any) => m.name.split('/').pop())
          .join(', ');
        console.log("Available Image Models:", imageModels);
      }
    } catch (e) { }

    // FALLBACK LOOP: Descobre modelos dinamicamente e tenta gerar
    let fallbackModels = [
      'gemini-2.0-flash',
      'gemini-1.5-flash',
      'gemini-1.5-pro'
    ];

    // Tenta buscar modelos disponíveis na conta do usuário
    try {
      console.log("Buscando modelos disponíveis na API...");
      const settings = getSettings();
      const apiKey = settings.googleApiKey || import.meta.env.VITE_GOOGLE_API_KEY;
      if (apiKey) {
        const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (listResp.ok) {
          const listData = await listResp.json();
          const availableModels = listData.models
            .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
            .map((m: any) => m.name.replace('models/', '')); // Remove prefixo models/ se existir

          if (availableModels.length > 0) {
            // Prioriza modelos Flash e Pro
            const sortedModels = availableModels.sort((a: string, b: string) => {
              const score = (name: string) => {
                if (name.includes('flash')) return 3;
                if (name.includes('pro')) return 2;
                return 1;
              };
              return score(b) - score(a);
            });
            console.log("Modelos encontrados via API:", sortedModels);
            fallbackModels = sortedModels;
          }
        }
      }
    } catch (e) {
      console.warn("Falha ao listar modelos dinâmicos, usando lista padrão.", e);
    }

    let lastError;

    // Prepare image data for SDK
    const base64Data = sketchBase64.replace(/^data:image\/[a-z]+;base64,/, "");

    for (const svModel of fallbackModels) {
      try {
        console.log(`Tentando fallback SVG com modelo: ${svModel}`);
        const ai = getAI();

        const svgPrompt = `
                You are a professional carpenter and technical drafter. 
                Look at the attached sketch/drawing and the description: "${prompt}".
                
                Create a detailed SVG (Scalable Vector Graphics) code that represents this furniture based on the sketch.
                
                **CRITICAL STYLE INSTRUCTIONS:**
                - Create a **SOLID 3D ISOMETRIC DRAWING** (SketchUp style).
                - **FILLED FACES**: Use white fill (#FFFFFF) for all furniture faces to make them look solid. Do NOT use transparent wireframes.
                - **OUTLINES**: Use bold black lines (#000000) for edges.
                - **BACKGROUND**: The SVG MUST have a solid white background. Add a <rect width="100%" height="100%" fill="white"/> as the first element.
                - Show realism: Add drawer handles, cabinet doors gaps, and thickness to tops.
                - View: 3D Isometric view showing front and side.
                - Aspect ratio: 4:3.
                
                Return ONLY the raw SVG code. Do not wrap in markdown. 
                Start with <svg and end with </svg>.
            `;

        const result = await ai.models.generateContent({
          model: svModel,
          contents: [
            {
              parts: [
                { text: svgPrompt },
                { inlineData: { mimeType: "image/png", data: base64Data } }
              ]
            }
          ]
        });

        let svgText = result.text || '';

        // Clean up markdown if present
        if (svgText.includes('```')) {
          svgText = svgText.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '');
        }

        // Validate SVG
        if (svgText.trim().startsWith('<svg') && svgText.includes('</svg>')) {
          console.log(`SVG Fallback sucesso com ${svModel}`);
          // Safe Base64 encoding for UTF-8 (emojis, accents, etc)
          const encodedSvg = btoa(unescape(encodeURIComponent(svgText)));
          return `data:image/svg+xml;base64,${encodedSvg}`;
        }

      } catch (loopError: any) {
        console.warn(`Falha no fallback com ${svModel}:`, loopError.message);
        lastError = loopError;
        // Continue to next model
      }
    }

    // Se chegou aqui, todos falharam
    console.error("Todos os fallbacks falharam.", lastError);
    let msg = "Não foi possível gerar a imagem.";
    if (lastError?.message?.includes('429')) {
      msg = "Limite de uso da API atingido em todos os modelos. Tente novamente em alguns minutos.";
    } else {
      msg = "A geração de imagem realista falhou e a criação do desenho técnico também não foi possível. Verifique se sua chave API tem permissões.";
    }

    throw new Error(msg);
  }
};