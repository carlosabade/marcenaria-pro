import { getSettings } from "./storageService";

export const generateImageFromSketchOpenAI = async (sketchBase64: string, prompt: string): Promise<string> => {
    const settings = getSettings();
    const apiKey = settings.openAIApiKey || import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error("Chave de API OpenAI não configurada.");
    }

    console.log(`OpenAI API Key carregada: ${apiKey.substring(0, 4)}...`);

    try {
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
        
        Return ONLY the raw SVG string. Do not use markdown blocks.
      `;

        const payload = {
            model: "gpt-5.2", // Cutting-edge model
            messages: [
                {
                    role: "user",
                    content: [
                        { type: "text", text: renderPrompt },
                        {
                            type: "image_url",
                            image_url: {
                                "url": sketchBase64
                            }
                        }
                    ]
                }
            ],
            max_tokens: 4096
        };

        const response = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            console.error("OpenAI API Error:", errData);
            throw new Error(`Erro OpenAI ${response.status}: ${errData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        let svgText = data.choices[0]?.message?.content || "";

        // Clean up markdown if present
        if (svgText.includes('```')) {
            svgText = svgText.replace(/```xml/g, '').replace(/```svg/g, '').replace(/```/g, '');
        }

        // Validate SVG
        if (svgText.trim().startsWith('<svg') && svgText.includes('</svg>')) {
            console.log("SVG gerado com sucesso via GPT-4o");
            // Safe Base64 encoding
            const encodedSvg = btoa(unescape(encodeURIComponent(svgText)));
            return `data:image/svg+xml;base64,${encodedSvg}`;
        } else {
            console.warn("Resposta OpenAI não parece ser um SVG válido:", svgText.substring(0, 50));
            throw new Error("A IA respondeu, mas não gerou um SVG válido.");
        }

    } catch (error: any) {
        console.error("Falha OpenAI:", error);
        throw error;
    }
};

export const generateDallEImage = async (prompt: string): Promise<string> => {
    const settings = getSettings();
    const apiKey = settings.openAIApiKey || import.meta.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

    if (!apiKey) {
        throw new Error("Chave de API OpenAI não configurada.");
    }

    // DALL-E 3 Implementation
    try {
        const response = await fetch("https://api.openai.com/v1/images/generations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`
            },
            body: JSON.stringify({
                model: "dall-e-3",
                prompt: `Architectural photography, realistic woodwork furniture, ${prompt}`,
                n: 1,
                size: "1024x1024",
                response_format: "b64_json",
                quality: "standard"
            })
        });

        if (!response.ok) {
            const errData = await response.json().catch(() => ({}));
            throw new Error(`Erro DALL-E ${response.status}: ${errData.error?.message || response.statusText}`);
        }

        const data = await response.json();
        const b64 = data.data[0].b64_json;
        return `data:image/png;base64,${b64}`;

    } catch (error) {
        console.error("Falha DALL-E:", error);
        throw error;
    }
}
