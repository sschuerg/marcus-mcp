import { N8nService } from '../n8nService.js';

const n8nService = new N8nService();

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

export const tools = [
  /**
   * List all workflows in n8n
   */
  {
    name: "list_workflows",
    description: "List all workflows in n8n",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: async () => {
      try {
        const result = await n8nService.listWorkflows();
        return formatResponse(result);
      } catch (error) {
        return formatError(error);
      }
    },
  },
  /**
   * Create a new workflow in n8n
   */
  {
    name: "create_workflow",
    description: "Create a new workflow in n8n",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        nodes: { 
          type: "array",
          items: { type: "object", additionalProperties: true } 
        },
        connections: { type: "object", additionalProperties: true },
        settings: { type: "object", additionalProperties: true },
      },
      required: ["name", "nodes", "connections"],
    },
    handler: async (args) => {
      try {
        const result = await n8nService.createWorkflow(args.name, args.nodes, args.connections, args.settings);
        return formatResponse(result);
      } catch (error) {
        return formatError(error);
      }
    },
  },
  /**
   * Activate or deactivate a workflow
   */
  {
    name: "activate_workflow",
    description: "Activate or deactivate a workflow",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        active: { type: "boolean" },
      },
      required: ["id", "active"],
    },
    handler: async (args) => {
      try {
        const result = await n8nService.activateWorkflow(args.id, args.active);
        return formatResponse(result);
      } catch (error) {
        return formatError(error);
      }
    },
  },
  /**
   * Execute a workflow by ID
   */
  {
    name: "execute_workflow",
    description: "Execute a workflow by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
        data: { type: "object" },
      },
      required: ["id"],
    },
    handler: async (args) => {
      try {
        const result = await n8nService.executeWorkflow(args.id, args.data);
        return formatResponse(result);
      } catch (error) {
        return formatError(error);
      }
    },
  },
  /**
   * Get workflow details by ID
   */
  {
    name: "get_workflow",
    description: "Get workflow details by ID",
    inputSchema: {
      type: "object",
      properties: {
        id: { type: "string" },
      },
      required: ["id"],
    },
    handler: async (args) => {
      try {
        const result = await n8nService.getWorkflow(args.id);
        return formatResponse(result);
      } catch (error) {
        return formatError(error);
      }
    },
  },
  /**
   * Search for available node types in n8n
   */
  {
    name: "search_node_types",
    description: "Search for available node types in n8n",
    inputSchema: {
      type: "object",
      properties: {
        query: { type: "string" },
      },
      required: ["query"],
    },
    handler: async (args) => {
      try {
        const result = await n8nService.searchNodeTypes(args.query);
        return formatResponse(result);
      } catch (error) {
        return formatError(error);
      }
    },
  },
  /**
   * Get details of a specific node type
   */
  {
    name: "get_node_details",
    description: "Get details of a specific node type",
    inputSchema: {
      type: "object",
      properties: {
        nodeTypeName: { type: "string" },
      },
      required: ["nodeTypeName"],
    },
    handler: async (args) => {
      try {
        const result = await n8nService.getNodeDetails(args.nodeTypeName);
        return formatResponse(result);
      } catch (error) {
        return formatError(error);
      }
    },
  },
  /**
   * List available credentials
   */
  {
    name: "list_credentials",
    description: "List available credentials",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: async () => {
      try {
        const result = await n8nService.listCredentials();
        return formatResponse(result);
      } catch (error) {
        return formatError(error);
      }
    },
  },
];
