import { N8nService } from '../n8nService.js';

const n8n = new N8nService();

/**
 * n8n Knowledge Tools
 */
export const n8nKnowledgeTools = [
  {
    name: "search_n8n_knowledge",
    description: "Search internal n8n workflows and node logic. Use this to find out how existing automations are built or which nodes are used where.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "The natural language search query" }
      },
      required: ["query"],
    },
    handler: async (args) => {
      try {
        const response = await n8n.client.post('/webhook/search-n8n-knowledge', {
          query: args.query
        });
        return response.data;
      } catch (error) {
        console.error("[n8n Knowledge Tool Error]:", error);
        throw new Error(`Failed to query n8n knowledge base: ${error.message}`);
      }
    },
  },
];
