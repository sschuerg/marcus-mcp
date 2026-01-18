import axios from 'axios';
import { config } from '../env.js';
import debug from 'debug';

const log = debug('mcp:model-router');

interface ModelConfig {
  name: string;
  provider: string;
  contextWindow: number;
  specialties: string[];
  priority: number;
}

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// 🎯 2026 State-of-the-Art Free Model Categories
const MODEL_CATEGORIES = {
  CODING: [
    { name: 'qwen/qwen-2.5-coder-32b-instruct:free', provider: 'Qwen', contextWindow: 32000, specialties: ['code-generation', 'debugging'], priority: 1 },
    { name: 'deepseek/deepseek-coder-33b-instruct:free', provider: 'DeepSeek', contextWindow: 16000, specialties: ['code', 'algorithms'], priority: 2 },
    { name: 'meta-llama/llama-3.2-3b-instruct:free', provider: 'Meta', contextWindow: 131000, specialties: ['fast-coding'], priority: 3 }
  ],
  
  CREATIVE: [
    { name: 'meta-llama/llama-3.3-70b-instruct:free', provider: 'Meta', contextWindow: 131000, specialties: ['creative-writing', 'storytelling'], priority: 1 },
    { name: 'nousresearch/hermes-3-llama-3.1-405b:free', provider: 'Nous', contextWindow: 131000, specialties: ['roleplay', 'dialogue'], priority: 2 },
    { name: 'google/gemini-2.0-flash-exp:free', provider: 'Google', contextWindow: 1000000, specialties: ['poetry', 'lyrics'], priority: 3 }
  ],
  
  GENERAL: [
    { name: 'google/gemini-2.0-flash-exp:free', provider: 'Google', contextWindow: 1000000, specialties: ['fast', 'long-context'], priority: 1 },
    { name: 'meta-llama/llama-3.3-70b-instruct:free', provider: 'Meta', contextWindow: 131000, specialties: ['balanced'], priority: 2 },
    { name: 'microsoft/phi-3-mini-128k-instruct:free', provider: 'Microsoft', contextWindow: 128000, specialties: ['efficient'], priority: 3 }
  ],
  
  REASONING: [
    { name: 'google/gemini-2.0-flash-exp:free', provider: 'Google', contextWindow: 1000000, specialties: ['reasoning', 'analysis'], priority: 1 },
    { name: 'meta-llama/llama-3.3-70b-instruct:free', provider: 'Meta', contextWindow: 131000, specialties: ['problem-solving'], priority: 2 }
  ],
  
  MULTIMODAL: [
    { name: 'google/gemini-2.0-flash-exp:free', provider: 'Google', contextWindow: 1000000, specialties: ['vision', 'multimodal'], priority: 1 }
  ]
};

// State Management
const modelState = new Map<string, {
  lastUsed: number;
  failureCount: number;
  lastError: string | null;
  successCount: number;
}>();

const categoryRotation = new Map<string, number>();

/**
 * Intelligente Kategorie-Erkennung basierend auf Prompt
 */
function detectCategory(prompt: string, explicitCategory?: string): keyof typeof MODEL_CATEGORIES {
  if (explicitCategory) {
    const upper = explicitCategory.toUpperCase() as keyof typeof MODEL_CATEGORIES;
    if (MODEL_CATEGORIES[upper]) return upper;
  }

  const lowerPrompt = prompt.toLowerCase();
  
  // CODING Keywords
  if (lowerPrompt.match(/\b(code|function|class|debug|refactor|algorithm|typescript|python|javascript|bug|error|compile|syntax|api|endpoint)\b/)) {
    log('Detected category: CODING');
    return 'CODING';
  }
  
  // CREATIVE Keywords
  if (lowerPrompt.match(/\b(story|creative|write|poem|lyrics|song|narrative|character|dialogue|fiction|novel|plot)\b/)) {
    log('Detected category: CREATIVE');
    return 'CREATIVE';
  }
  
  // REASONING Keywords
  if (lowerPrompt.match(/\b(analyze|reasoning|logic|problem|solve|complex|multi-step|plan|strategy)\b/)) {
    log('Detected category: REASONING');
    return 'REASONING';
  }
  
  log('Detected category: GENERAL (fallback)');
  return 'GENERAL';
}

/**
 * Wählt das beste verfügbare Model für die Kategorie
 */
function selectBestModel(category: keyof typeof MODEL_CATEGORIES): ModelConfig {
  const models = MODEL_CATEGORIES[category];
  const currentRotation = categoryRotation.get(category) || 0;
  
  const sortedModels = models
    .map(model => {
      const state = modelState.get(model.name) || { 
        lastUsed: 0, 
        failureCount: 0, 
        lastError: null, 
        successCount: 0 
      };
      
      const timeSinceFailure = Date.now() - state.lastUsed;
      const failurePenalty = state.failureCount > 0 && timeSinceFailure < 300000 ? 1000 : 0;
      const successRate = state.successCount / (state.successCount + state.failureCount + 1);
      
      return {
        ...model,
        score: model.priority + failurePenalty - (successRate * 10)
      };
    })
    .sort((a, b) => a.score - b.score);
  
  const topModels = sortedModels.slice(0, 2);
  const selectedModel = topModels[currentRotation % topModels.length];
  
  categoryRotation.set(category, currentRotation + 1);
  
  log(`Selected ${selectedModel.name} from category ${category}`);
  return selectedModel;
}

/**
 * Haupt-API
 */
export async function sendSmartRequest(
  prompt: string,
  systemPrompt?: string,
  options: {
    category?: string;
    maxRetries?: number;
    temperature?: number;
    maxTokens?: number;
  } = {}
): Promise<{
  content: string;
  modelUsed: string;
  category: string;
  attempts: number;
}> {
  
  const category = detectCategory(prompt, options.category);
  const maxRetries = options.maxRetries || 3;
  const temperature = options.temperature || 0.7;
  const maxTokens = options.maxTokens || 2000;
  
  const messages: OpenRouterMessage[] = [
    ...(systemPrompt ? [{ role: 'system' as const, content: systemPrompt }] : []),
    { role: 'user', content: prompt }
  ];
  
  let attempts = 0;
  let lastError: any = null;
  
  while (attempts < maxRetries) {
    const model = selectBestModel(category);
    attempts++;
    
    try {
      log(`Attempt ${attempts}/${maxRetries} with ${model.name}`);
      
      const content = await makeRequest(messages, model.name, temperature, maxTokens);
      updateModelState(model.name, true);
      
      return {
        content,
        modelUsed: model.name,
        category,
        attempts
      };
      
    } catch (error: any) {
      lastError = error;
      updateModelState(model.name, false, error.message);
      log(`Failed with ${model.name}: ${error.message}`);
      
      if (attempts < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }
  
  throw new Error(`All models failed. Last: ${lastError?.message}`);
}

async function makeRequest(
  messages: OpenRouterMessage[],
  model: string,
  temperature: number,
  maxTokens: number
): Promise<string> {
  
  const response = await axios.post<OpenRouterResponse>(
    'https://openrouter.ai/api/v1/chat/completions',
    {
      model,
      messages,
      temperature,
      max_tokens: maxTokens
    },
    {
      headers: {
        'Authorization': `Bearer ${config.OPENROUTER_API_KEY}`,
        'HTTP-Referer': 'https://marcus-mcp.local',
        'X-Title': 'MARCUS MCP',
        'Content-Type': 'application/json'
      },
      timeout: 45000
    }
  );

  const content = response.data.choices[0]?.message?.content;
  if (!content) throw new Error('No content in response');
  return content;
}

function updateModelState(modelName: string, success: boolean, error?: string) {
  const state = modelState.get(modelName) || { 
    lastUsed: 0, 
    failureCount: 0, 
    lastError: null, 
    successCount: 0 
  };
  
  state.lastUsed = Date.now();
  
  if (success) {
    state.successCount++;
    state.failureCount = Math.max(0, state.failureCount - 1);
    state.lastError = null;
  } else {
    state.failureCount++;
    state.lastError = error || 'Unknown';
  }
  
  modelState.set(modelName, state);
}

export function getRouterStats() {
  return {
    categories: Object.keys(MODEL_CATEGORIES),
    modelState: Array.from(modelState.entries())
  };
}

export const MODEL_CODING = 'qwen/qwen-2.5-coder-32b-instruct:free';
export const MODEL_GENERAL = 'google/gemini-2.0-flash-exp:free';
export const MODEL_CREATIVE = 'meta-llama/llama-3.3-70b-instruct:free';
