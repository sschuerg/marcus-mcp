import { sendSmartRequest, getRouterStats, MODEL_CODING, MODEL_GENERAL, MODEL_CREATIVE } from './smartModelRouter.js';

// Re-export for backward compatibility
export { MODEL_CODING, MODEL_GENERAL, MODEL_CREATIVE, getRouterStats };

interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

/**
 * Legacy function - routes through Smart Router
 */
export async function sendChatRequest(
  messages: OpenRouterMessage[],
  preferredModel?: string,
  maxRetries: number = 3
): Promise<string> {
  
  const systemPrompt = messages.find(m => m.role === 'system')?.content;
  const userPrompt = messages.find(m => m.role === 'user')?.content || '';
  
  // Detect category from preferred model
  let category: string | undefined;
  if (preferredModel?.includes('coder') || preferredModel?.includes('devstral') || preferredModel?.includes('mimo')) {
    category = 'CODING';
  } else if (preferredModel?.includes('llama') || preferredModel?.includes('hermes') || preferredModel?.includes('qwen-3-235')) {
    category = 'CREATIVE';
  }
  
  const result = await sendSmartRequest(userPrompt, systemPrompt, { 
    category, 
    maxRetries 
  });
  
  return result.content;
}

/**
 * OpenRouterService class - supports both static and instance methods
 */
export class OpenRouterService {
  /**
   * Static: Send a message
   */
  static async sendMessage(messages: OpenRouterMessage[], model?: string): Promise<string> {
    return sendChatRequest(messages, model);
  }
  
  /**
   * Static: Analyze context
   */
  static async analyzeContext(
    systemPrompt: string, 
    userContent: string, 
    preferredModel?: string
  ): Promise<string> {
    return OpenRouterService._analyzeContextImpl(systemPrompt, userContent, preferredModel);
  }
  
  /**
   * Instance: Analyze context (for backward compatibility with aiTools.ts)
   */
  async analyzeContext(
    systemPrompt: string, 
    userContent: string, 
    preferredModel?: string
  ): Promise<string> {
    return OpenRouterService._analyzeContextImpl(systemPrompt, userContent, preferredModel);
  }
  
  /**
   * Instance: Send message
   */
  async sendMessage(messages: OpenRouterMessage[], model?: string): Promise<string> {
    return sendChatRequest(messages, model);
  }
  
  /**
   * Private implementation of analyzeContext (used by both static and instance)
   */
  private static async _analyzeContextImpl(
    systemPrompt: string, 
    userContent: string, 
    preferredModel?: string
  ): Promise<string> {
    
    // Detect category from preferred model or content
    let category: string | undefined;
    
    if (preferredModel?.includes('coder') || 
        preferredModel?.includes('devstral') || 
        preferredModel?.includes('mimo') ||
        preferredModel === MODEL_CODING) {
      category = 'CODING';
    } else if (preferredModel?.includes('llama') || 
               preferredModel?.includes('hermes') ||
               preferredModel?.includes('qwen-3-235') ||
               preferredModel === MODEL_CREATIVE) {
      category = 'CREATIVE';
    } else if (preferredModel === MODEL_GENERAL) {
      category = 'GENERAL';
    }
    
    const result = await sendSmartRequest(
      userContent, 
      systemPrompt, 
      { 
        category,
        maxRetries: 3,
        temperature: 0.7,
        maxTokens: 2000
      }
    );
    
    return result.content;
  }
}
