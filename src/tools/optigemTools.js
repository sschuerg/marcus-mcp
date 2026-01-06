import { N8nService } from '../n8nService.js';

const n8n = new N8nService();

/**
 * Helper to format success response for MCP
 */
const formatResponse = (data) => ({
  content: [
    {
      type: "text",
      text: JSON.stringify(data, null, 2)
    }
  ]
});

/**
 * Helper to format error response for MCP
 */
const formatError = (error) => ({
  content: [
    {
      type: "text",
      text: JSON.stringify({
        error: error.message,
        stack: error.stack
      }, null, 2)
    }
  ],
  isError: true
});

/**
 * Optigem Knowledge Tools
 */
export const optigemTools = [
  {
    name: "query_optigem",
    description: "Search the internal knowledge base for member data, events, and organizational information from Optigem.",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string", description: "The natural language search query" }
      },
      required: ["query"],
    },
    handler: async (args) => {
      try {
        // Execute the OPTIGEM_SEARCH workflow via webhook
        const response = await n8n.client.post('/webhook/search-optigem', {
          query: args.query
        });

        return formatResponse(response.data);
      } catch (error) {
        console.error("[Optigem Tool Error]:", error);
        return formatError(new Error(`Failed to query Optigem via n8n: ${error.message}`));
      }
    },
  },
];
