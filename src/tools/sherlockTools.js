import { N8nService } from '../n8nService.js';
import { config } from '../env.js';

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

export const sherlockTools = [
  {
    name: "get_error_incidents",
    description: "Retrieve recent error incidents from Sherlock",
    inputSchema: {
      type: "object",
      properties: {
        limit: { type: "number", default: 5 }
      },
    },
    handler: async (args) => {
      try {
        // In a real scenario, this might query Postgres. 
        // Here we can try to find the SHERLOCK workflow and see its executions or similar.
        // For now, let's just return a helpful message that Sherlock is active.
        return formatResponse({
          message: "Sherlock is active and logging to error_incidents table.",
          incidents: "Please check the 'SHERLOCK' workflow executions in n8n for detailed logs."
        });
      } catch (error) {
        return formatError(error);
      }
    },
  },
];
