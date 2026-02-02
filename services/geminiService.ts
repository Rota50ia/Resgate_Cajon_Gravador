
import { GoogleGenAI } from "@google/genai";

export class GeminiService {
  /**
   * Obtém feedback personalizado de um "Rhythm Coach" focado em Cajón.
   */
  async getRhythmFeedback(stats: { pattern: string, accuracy: number, actualBPM: number, trend: string }) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    
    const prompt = `
      Estatísticas de Performance:
      - Ritmo Praticado: ${stats.pattern}
      - Precisão: ${stats.accuracy}%
      - Tempo Gravado: ${stats.actualBPM} BPM
      - Tendência de Tempo: ${stats.trend}
      
      Instruções:
      Atue como um professor de Cajón profissional. Analise estes resultados e forneça 2 frases de conselho técnico e motivador em Português (PT-BR). 
      Fale especificamente sobre a importância de manter o pulso e como melhorar a dinâmica entre graves e agudos.
    `;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: {
          systemInstruction: "Você é o instrutor master do curso 'Resgate do Cajón'. Sua linguagem é técnica porém encorajadora.",
          temperature: 0.7,
        }
      });
      return response.text;
    } catch (error) {
      console.error("Gemini Coaching Error:", error);
      return "Ótima sessão! Senti firmeza no seu toque. Continue praticando para masterizar a dinâmica desse groove.";
    }
  }

  async processSnippets(snippets: string[], instruction: string) {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const combinedCode = snippets.join('\n\n--- MODULE ---\n\n');
    const prompt = `Instruction: ${instruction}\n\nCodebase:\n${combinedCode}`;

    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: prompt,
        config: {
          systemInstruction: "Você é um arquiteto de software sênior.",
          thinkingConfig: { thinkingBudget: 4000 }
        }
      });
      return response.text;
    } catch (error) {
      console.error("Gemini API Error:", error);
      throw error;
    }
  }
}

export const geminiService = new GeminiService();
