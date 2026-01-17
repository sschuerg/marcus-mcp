import { N8nService } from '../n8nService.js';
import { OpenRouterService, MODEL_CODING, MODEL_GENERAL } from '../services/openRouterService.js';

const n8nService = new N8nService();
const aiService = new OpenRouterService();

export const aiTools = [
  {
    name: 'analyze_workflow_with_ai',
    description: 'Analyzes an n8n workflow using Qwen 2.5 Coder (Free) to find errors, security risks, and optimization opportunities.',
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: { type: 'string', description: 'The ID of the workflow to analyze' },
        focus: { type: 'string', enum: ['general', 'security', 'performance', 'error_handling'] }
      },
      required: ['workflowId']
    },
    handler: async (args: any) => {
      const { workflowId, focus } = args;

      console.log(`[AI Tool] Fetching workflow ${workflowId}...`);
      let workflow;
      try {
        workflow = await n8nService.getWorkflow(workflowId);
      } catch (err: any) {
        return { content: [{ type: 'text', text: `Fehler: Konnte Workflow ${workflowId} nicht finden. (${err.message})` }] };
      }

      const cleanWorkflow = {
        name: workflow.name,
        nodes: workflow.nodes.map((n: any) => ({
          name: n.name,
          type: n.type,
          parameters: n.parameters,
        })),
        connections: workflow.connections
      };

      const systemPrompt = `Du bist ein erfahrener n8n Workflow Architect. Analysiere den Workflow JSON. Fokus: ${focus || 'general'}. Antworte auf Deutsch.`;
      
      console.log(`[AI Tool] Analyzing workflow with Qwen 2.5 Coder...`);
      try {
        const analysis = await aiService.analyzeContext(systemPrompt, JSON.stringify(cleanWorkflow, null, 2), MODEL_CODING);
        return { content: [{ type: 'text', text: analysis }] };
      } catch (err: any) {
        return { content: [{ type: 'text', text: `AI Analyse fehlgeschlagen: ${err.message}` }] };
      }
    }
  },
  {
    name: 'consult_ai_general',
    description: 'General purpose AI assistant using Google Gemini 2.0 Flash (Free). Use for brainstorming, writing documentation, or summarizing text.',
    inputSchema: {
      type: 'object',
      properties: {
        prompt: { type: 'string', description: 'The question or task for the AI' },
        context: { type: 'string', description: 'Optional context (e.g. email content, documentation snippet)' }
      },
      required: ['prompt']
    },
    handler: async (args: any) => {
      const { prompt, context } = args;
      const systemPrompt = `Du bist ein hilfreicher AI Assistent im Kontext von n8n und Automatisierung. Antworte präzise und hilfreich auf Deutsch.`;
      const userContent = context ? `Kontext:\n${context}\n\nFrage/Aufgabe:\n${prompt}` : prompt;

      console.log(`[AI Tool] Consulting Gemini 2.0 Flash...`);
      try {
        const answer = await aiService.analyzeContext(systemPrompt, userContent, MODEL_GENERAL);
        return { content: [{ type: 'text', text: answer }] };
      } catch (err: any) {
        return { content: [{ type: 'text', text: `AI Anfrage fehlgeschlagen: ${err.message}` }] };
      }
    }
  }
];
