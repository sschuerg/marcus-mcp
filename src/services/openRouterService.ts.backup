import axios from 'axios';
import { config } from '../env.js';
import Debug from 'debug';

const debug = Debug('mcp:ai');

// Coding Model (Best for JSON/Code)
export const MODEL_CODING = config.LLM_MODEL_CODING;
// General Model (Best for Text/Creative/Reasoning)
export const MODEL_GENERAL = "google/gemini-2.0-flash-exp:free";

export class OpenRouterService {
  private client;

  constructor() {
    this.client = axios.create({
      baseURL: 'https://openrouter.ai/api/v1',
      headers: {
        'Authorization': `Bearer ${config.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://marcus-mcp.local',
        'X-Title': 'MARCUS MCP',
        'Content-Type': 'application/json'
      }
    });
  }

  async analyzeContext(systemPrompt: string, userContent: string, model: string = MODEL_CODING): Promise<string> {
    if (!config.OPENROUTER_API_KEY) {
      throw new Error("OPENROUTER_API_KEY is not set in configuration.");
    }

    debug(`Sending request to OpenRouter using model: ${model}`);
    
    try {
      const response = await this.client.post('/chat/completions', {
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent }
        ],
        temperature: 0.7,
        max_tokens: 4000
      });

      const answer = response.data.choices[0]?.message?.content;
      return answer || "Keine Antwort vom AI Modell erhalten.";

    } catch (error: any) {
      console.error("[OpenRouter] Error:", error.response?.data || error.message);
      throw new Error(`AI Request failed: ${error.response?.data?.error?.message || error.message}`);
    }
  }
}
