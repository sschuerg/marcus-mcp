import { OutgoingHttpHeaders, OutgoingHttpHeader } from 'http';
import express, { Request, Response, NextFunction } from 'express';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { config } from './env.js';
import { queryOptigemPersons, queryOptigemPersonById } from './tools/optigem/optigem-query.js';
import { tools as workflowTools } from './tools/workflowTools.js';
import { sherlockTools } from './tools/sherlockTools.js';
import { n8nKnowledgeTools } from './tools/n8nKnowledgeTools.js';
import Debug from 'debug';
import { tools as n8nNodeTemplateTools } from './tools/n8nNodeTemplates.js';
import { optigemTools } from './tools/optigem/optigem-tools.js';
import { importWorkflowTools } from './tools/importWorkflowTools.js';
import { aiTools } from './tools/aiTools.js';
import { agentDeploymentTools } from './tools/agentDeploymentTools.js';


const tools = [...workflowTools, ...sherlockTools, ...n8nKnowledgeTools, ...optigemTools, ...n8nNodeTemplateTools, ...importWorkflowTools, ...aiTools, ...agentDeploymentTools];

const debugServer = Debug('mcp:server');
const debugSSE = Debug('mcp:sse');
const debugWebhook = Debug('mcp:webhook');
const debugTool = Debug('mcp:tool');


/**
 * MCP Server Implementation - Simplified Global Session Mode
 * Features: No Auth, Global Session, Robust SSE/HTTP handling
 */
async function main() {
  const app = express();
  const jsonParser = express.json();

  // Authentication Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path === "/health") return next();
    
    const authHeader = req.headers.authorization;
    const token = config.MCP_BEARER_TOKEN;

    if (token && authHeader !== `Bearer ${token}`) {
      debugServer(`Unauthorized access attempt to ${req.path} from ${req.ip}`);
      return res.status(401).json({ error: "Unauthorized. Valid Bearer Token required." });
    }
    next();
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    if (req.path.includes("/message")) {
      next();
    } else {
      jsonParser(req, res, next);
    }
  });

  const server = new Server(
    {
      name: config.MCP_SERVER_NAME || "MARCUS",
      version: config.MCP_SERVER_VERSION || "1.1.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // Tool Discovery
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: [
      ...tools.map(t => ({
        name: t.name,
        description: t.description,
        inputSchema: t.inputSchema
      })),
      {
        name: 'query_optigem_persons',
        description: 'Query persons from Optigem database. Supports staging and production mode.',
        inputSchema: {
          type: 'object',
          properties: {
            searchTerm: {
              type: 'string',
              description: 'Search term for firstname, lastname, or email',
            },
            mode: {
              type: 'string',
              enum: ['staging', 'production'],
              description: 'Database mode. Default: staging',
            },
            limit: {
              type: 'number',
              description: 'Maximum number of results. Default: 100',
            },
          },
        },
      },
      {
        name: 'query_optigem_person_by_id',
        description: 'Get a single person by ID from Optigem database',
        inputSchema: {
          type: 'object',
          properties: {
            id: {
              type: 'number',
              description: 'Person ID',
            },
            mode: {
              type: 'string',
              enum: ['staging', 'production'],
              description: 'Database mode. Default: staging',
            },
          },
          required: ['id'],
        },
      },
    ]
  }));

  // Tool Execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    switch (request.params.name) {
      case 'query_optigem_persons': {
        const { searchTerm, mode, limit } = request.params.arguments as any;
        const result = await queryOptigemPersons(searchTerm, mode, limit);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2),
          }],
        };
      }
      
      case 'query_optigem_person_by_id': {
        const { id, mode } = request.params.arguments as any;
        const result = await queryOptigemPersonById(id, mode);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2),
          }],
        };
      }
      
      default: {
        const tool = tools.find(t => t.name === request.params.name);
        if (!tool) {
          throw new Error(`Unknown tool: ${request.params.name}`);
        }
        debugTool(`Executing: ${request.params.name}`);
        try {
          return await tool.handler(request.params.arguments);
        } catch (error: any) {
          console.error(`[Tool Error] ${request.params.name}:`, error);
          throw error;
        }
      }
    }
  });

  // Global/Latest transport for simplified single-client mode
  let activeTransport: SSEServerTransport | null = null;
  const transports = new Map<string, SSEServerTransport>();

  // SSE Endpoint (Hybrid: Handles standard SSE and n8n's HTTP-RPC)
  app.use("/sse", async (req: Request, res: Response) => {
    
    // WORKAROUND: If n8n sends a POST with a JSON body, it's likely trying to do stateless HTTP JSON-RPC
    if (req.method === 'POST' && req.body && req.body.jsonrpc) {
        debugSSE(`Injecting initial JSON-RPC message from POST body:`, JSON.stringify(req.body));
        
        // Check for SSE desire
        const accept = req.headers['accept'] || '';
        if (!accept.includes('text/event-stream')) {
             debugSSE(`Client wants JSON (HTTP-RPC). Sending 406.`);
             return res.status(406).json({ error: "Not Acceptable. Please use SSE." });
        }
    }

    debugSSE(`New connection request from ${req.ip} (${req.method})`);
    
    // 1. Send headers manually
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });

    // 2. Monkey-patch writeHead
    const originalWriteHead = res.writeHead;
    (res as any).writeHead = function(...args: [number, OutgoingHttpHeaders | OutgoingHttpHeader[] | undefined]) {
        if (res.headersSent) return this;
        return originalWriteHead.apply(this, args);
    };
    
    // Create new transport
    const transport = new SSEServerTransport("/message", res as any);
    const sessionId = transport.sessionId;
    
    // Set as active transport (Single Client Mode)
    activeTransport = transport;
    transports.set(sessionId, transport);
    
    debugSSE(`Session created: ${sessionId}`);

    res.on('close', () => {
      debugSSE(`Session closed: ${sessionId}`);
      transports.delete(sessionId);
      if (activeTransport === transport) activeTransport = null;
    });

    // 3. Send endpoint event - DYNAMIC HOST DETECTION
    const protocol = req.protocol;
    const host = req.get('host');
    const endpointUrl = `${protocol}://${host}/message`;
    res.write(`event: endpoint\ndata: ${endpointUrl}\n\n`);
    debugSSE(`Advertised endpoint: ${endpointUrl}`);

    await server.connect(transport);
    debugSSE(`Connected and streaming`);

    // 4. Inject initial message if present
    if (req.method === 'POST' && req.body && req.body.jsonrpc) {
        if (transport.onmessage) {
            try {
                transport.onmessage(req.body);
                debugSSE(`Injected initial message.`);
            } catch (err) {
                console.error(`[SSE] Failed to inject:`, err);
            }
        }
    }
  });

  // Message Endpoint - SIMPLIFIED
  app.post("/message", async (req: Request, res: Response) => {
    // Try to get session from query, otherwise use active transport
    let transport = transports.get(req.query.sessionId as string);
    
    if (!transport) {
        if (activeTransport) {
            debugServer(`No sessionId in request, using active transport.`);
            transport = activeTransport;
        } else {
            console.warn(`[Message] No active session found for request.`);
            return res.status(404).json({ error: "Session not found" });
        }
    }

    try {
      await (transport as any).handlePostMessage(req, res);
    } catch (error) {
      console.error(`[Message Error]`, error);
      if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
    }
  });

  // Health Check
  app.get("/health", (req: Request, res: Response) => {
    res.json({ status: "ok", server: config.MCP_SERVER_NAME, version: config.MCP_SERVER_VERSION });
  });

  // Webhook / Stateless Tool Execution Endpoint
  app.post("/webhook", async (req: Request, res: Response) => {
    const { tool: toolName, args } = req.body;
    
    if (!toolName) {
      return res.status(400).json({ error: "Missing 'tool' parameter in request body." });
    }

    switch (toolName) {
      case 'query_optigem_persons': {
        const { searchTerm, mode, limit } = args as any;
        const result = await queryOptigemPersons(searchTerm, mode, limit);
        return res.json({
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2),
          }],
        });
      }
      
      case 'query_optigem_person_by_id': {
        const { id, mode } = args as any;
        const result = await queryOptigemPersonById(id, mode);
        return res.json({
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2),
          }],
        });
      }
      
      default: {
        const tool = tools.find(t => t.name === toolName);
        if (!tool) {
          return res.status(404).json({ error: `Tool '${toolName}' not found.` });
        }
    
        debugWebhook(`Executing tool: ${toolName}`);
        try {
          // Result is now an MCP Standard Object: { content: [{ type: "text", text: "JSON..." }] }
          const mcpResult: any = await tool.handler(args || {});
          
          // Unwrap logic for HTTP clients
          if (mcpResult && mcpResult.content && Array.isArray(mcpResult.content) && mcpResult.content[0]?.text) {
              try {
                  const rawResult = JSON.parse(mcpResult.content[0].text);
                  return res.json(rawResult);
              } catch (parseError) {
                  debugWebhook("Failed to parse tool response content as JSON, returning raw text.");
                  return res.json({ result: mcpResult.content[0].text });
              }
          }
          
          // Fallback if structure is unexpected
          res.json(mcpResult);
    
        } catch (error: any) {
          console.error(`[Webhook Error] Tool '${toolName}' failed:`, error);
          res.status(500).json({ 
            error: `Tool execution failed`, 
            details: error.message 
          });
        }
      }
    }
  });

  const port = parseInt(config.PORT || '3000', 10);
  const authStatus = config.MCP_BEARER_TOKEN ? "ENABLED (Bearer Token)" : "DISABLED";
  
  app.listen(port, '0.0.0.0', () => {
    console.log(`
┌──────────────────────────────────────────────────┐
│  🚀 MCP Server (Simplified Global Mode)         │
├──────────────────────────────────────────────────┤
│  Port:    ${port.toString().padEnd(38)} │
│  SSE:     /sse                                   │
│  Auth:    ${authStatus.padEnd(38)} │
│  Debug:   Enabled (env: DEBUG=mcp:*)             │
└──────────────────────────────────────────────────┘
    `);
  });
}

main().catch((error) => {
  console.error("[Fatal] Server failed to start:", error);
  process.exit(1);
});
