import { 
  ALL_NODES,
  getNodeTemplate,
  getAllNodeTypes,
  N8nNodeTemplate
} from '../templates/n8n-node-reference.js';

export const n8nNodeTemplateTools = [
  {
    name: 'list_node_types',
    description: 'List all available n8n node types. Categories: trigger, data, flow, api, ai, database, utility, mcp, communication, email, productivity, crm, payment, ecommerce, developer, file, microsoft',
    inputSchema: {
      type: 'object',
      properties: {
        category: {
          type: 'string',
          description: 'Filter by category',
          enum: ['trigger', 'data', 'flow', 'api', 'ai', 'database', 'utility', 'mcp', 'communication', 'email', 'productivity', 'crm', 'payment', 'ecommerce', 'developer', 'file', 'microsoft', 'all']
        }
      }
    },
    handler: async (args: any) => {
      const category = args?.category || 'all';
      let filteredNodes: Record<string, N8nNodeTemplate>;
      
      if (category === 'all') {
        filteredNodes = ALL_NODES;
      } else {
        filteredNodes = Object.fromEntries(
          Object.entries(ALL_NODES).filter(([_key, node]) => node.category === category)
        );
      }

      const nodeList = Object.entries(filteredNodes).map(([key, node]) => ({
        name: key,
        type: node.type,
        version: node.typeVersion,
        category: node.category,
        description: node.description
      }));

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            category,
            count: nodeList.length,
            nodes: nodeList
          }, null, 2)
        }]
      };
    }
  },
  
  {
    name: 'get_node_template',
    description: 'Get detailed template for a specific node type',
    inputSchema: {
      type: 'object',
      properties: {
        nodeType: {
          type: 'string',
          description: 'Node type name'
        }
      },
      required: ['nodeType']
    },
    handler: async (args: any) => {
      const nodeType = args?.nodeType;
      
      if (!nodeType) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: 'nodeType is required',
              availableTypes: getAllNodeTypes()
            }, null, 2)
          }],
          isError: true
        };
      }

      const template = getNodeTemplate(nodeType);
      
      if (!template) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: `Node type "${nodeType}" not found`,
              availableTypes: getAllNodeTypes().slice(0, 20),
              total: getAllNodeTypes().length
            }, null, 2)
          }],
          isError: true
        };
      }

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            nodeType,
            template,
            usage: {
              example: {
                name: `My ${nodeType}`,
                type: template.type,
                typeVersion: template.typeVersion,
                position: [250, 300],
                parameters: template.parameters
              }
            }
          }, null, 2)
        }]
      };
    }
  },

  {
    name: 'generate_workflow_from_template',
    description: 'Generate a complete n8n workflow JSON from node templates',
    inputSchema: {
      type: 'object',
      properties: {
        workflowName: {
          type: 'string',
          description: 'Name of the workflow'
        },
        nodeTypes: {
          type: 'array',
          description: 'Array of node type names',
          items: { type: 'string' }
        },
        autoConnect: {
          type: 'boolean',
          description: 'Automatically connect nodes in sequence'
        }
      },
      required: ['workflowName', 'nodeTypes']
    },
    handler: async (args: any) => {
      const { workflowName, nodeTypes, autoConnect = true } = args;
      
      if (!Array.isArray(nodeTypes) || nodeTypes.length === 0) {
        return {
          content: [{
            type: 'text',
            text: JSON.stringify({
              error: 'nodeTypes must be a non-empty array',
              availableTypes: getAllNodeTypes().slice(0, 20),
              total: getAllNodeTypes().length
            }, null, 2)
          }],
          isError: true
        };
      }

      const nodes = [];
      const connections: any = {};
      let xPos = 250;
      const yPos = 300;
      
      for (let i = 0; i < nodeTypes.length; i++) {
        const nodeType = nodeTypes[i];
        const template = getNodeTemplate(nodeType);
        
        if (!template) {
          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                error: `Node type "${nodeType}" not found at index ${i}`,
                nodeType,
                availableTypes: getAllNodeTypes().slice(0, 20)
              }, null, 2)
            }],
            isError: true
          };
        }

        const nodeName = nodeType.charAt(0).toUpperCase() + nodeType.slice(1);
        const nodeId = `node-${i}`;
        
        nodes.push({
          id: nodeId,
          name: nodeName,
          type: template.type,
          typeVersion: template.typeVersion,
          position: [xPos, yPos],
          parameters: template.parameters
        });

        if (autoConnect && i > 0) {
          const prevNodeName = nodeTypes[i - 1].charAt(0).toUpperCase() + nodeTypes[i - 1].slice(1);
          connections[prevNodeName] = {
            main: [[{
              node: nodeName,
              type: 'main',
              index: 0
            }]]
          };
        }

        xPos += 200;
      }

      const workflow = {
        name: workflowName,
        nodes,
        connections,
        settings: {
          executionOrder: 'v1',
          callerPolicy: 'workflowsFromSameOwner',
          availableInMCP: false
        },
        active: false
      };

      return {
        content: [{
          type: 'text',
          text: JSON.stringify(workflow, null, 2)
        }]
      };
    }
  }
];

export const tools = n8nNodeTemplateTools;
