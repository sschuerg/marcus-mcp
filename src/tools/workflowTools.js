import { N8nService } from '../n8nService.js';

const n8nService = new N8nService();

export const tools = [
  {
    name: "list_workflows",
    description: "List all workflows in n8n",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: async () => {
      return await n8nService.listWorkflows();
    },
  },
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
      return await n8nService.createWorkflow(args.name, args.nodes, args.connections, args.settings);
    },
  },
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
      return await n8nService.activateWorkflow(args.id, args.active);
    },
  },
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
      return await n8nService.executeWorkflow(args.id, args.data);
    },
  },
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
      return await n8nService.getWorkflow(args.id);
    },
  },
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
      return await n8nService.searchNodeTypes(args.query);
    },
  },
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
      return await n8nService.getNodeDetails(args.nodeTypeName);
    },
  },
  {
    name: "list_credentials",
    description: "List available credentials",
    inputSchema: {
      type: "object",
      properties: {},
    },
    handler: async () => {
      return await n8nService.listCredentials();
    },
  },
];
