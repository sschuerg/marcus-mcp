import express from 'express';
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { config } from './env.js';
import { tools as workflowTools } from './tools/workflowTools.js';
import { sherlockTools } from './tools/sherlockTools.js';
import { optigemTools } from './tools/optigemTools.js';
import { n8nKnowledgeTools } from './tools/n8nKnowledgeTools.js';

const tools = [...workflowTools, ...sherlockTools, ...optigemTools, ...n8nKnowledgeTools];

/**
 * MCP Server Implementation - Simplified Global Session Mode
 * Features: No Auth, Global Session, Robust SSE/HTTP handling
 */
async function main() {
  const app = express();
  const jsonParser = express.json();
  app.use((req, res, next) => {
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
    tools: tools.map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema
    }))
  }));

  // Tool Execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const tool = tools.find(t => t.name === request.params.name);
    if (!tool) {
      throw new Error(`Tool not found: ${request.params.name}`);
    }
    console.log(`[Tool] Executing: ${request.params.name}`);
    try {
      return await tool.handler(request.params.arguments);
    } catch (error) {
      console.error(`[Tool Error] ${request.params.name}:`, error);
      throw error;
    }
  });

  // Global/Latest transport for simplified single-client mode
  let activeTransport = null;
  const transports = new Map();

  // SSE Endpoint (Hybrid: Handles standard SSE and n8n's HTTP-RPC)
  app.use("/sse", async (req, res) => {
    
    // WORKAROUND: If n8n sends a POST with a JSON body, it's likely trying to do stateless HTTP JSON-RPC
    if (req.method === 'POST' && req.body && req.body.jsonrpc) {
        console.log(`[SSE] Injecting initial JSON-RPC message from POST body:`, JSON.stringify(req.body));
        
        // Check for SSE desire
        const accept = req.headers['accept'] || '';
        if (!accept.includes('text/event-stream')) {
             console.log(`[HTTP-RPC] Client wants JSON. Sending 406.`);
             return res.status(406).json({ error: "Not Acceptable. Please use SSE." });
        }
    }

    console.log(`[SSE] New connection request from ${req.ip} (${req.method})`);
    
    // 1. Send headers manually
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    });

    // 2. Monkey-patch writeHead
    const originalWriteHead = res.writeHead;
    res.writeHead = function(...args) {
        if (res.headersSent) return this;
        return originalWriteHead.apply(this, args);
    };
    
    // Create new transport
    const transport = new SSEServerTransport("/message", res);
    const sessionId = transport.sessionId;
    
    // Set as active transport (Single Client Mode)
    activeTransport = transport;
    transports.set(sessionId, transport);
    
    console.log(`[SSE] Session created: ${sessionId}`);

    res.on('close', () => {
      console.log(`[SSE] Session closed: ${sessionId}`);
      transports.delete(sessionId);
      if (activeTransport === transport) activeTransport = null;
    });

    // 3. Send endpoint event - DYNAMIC HOST DETECTION
    const protocol = req.protocol;
    const host = req.get('host');
    const endpointUrl = `${protocol}://${host}/message`;
    res.write(`event: endpoint\ndata: ${endpointUrl}\n\n`);
    console.log(`[SSE] Advertised endpoint: ${endpointUrl}`);

    await server.connect(transport);
    console.log(`[SSE] Connected and streaming`);

    // 4. Inject initial message if present
    if (req.method === 'POST' && req.body && req.body.jsonrpc) {
        if (transport.onmessage) {
            try {
                transport.onmessage(req.body);
                console.log(`[SSE] Injected initial message.`);
            } catch (err) {
                console.error(`[SSE] Failed to inject:`, err);
            }
        }
    }
  });

  // Message Endpoint - SIMPLIFIED
  app.post("/message", async (req, res) => {
    // Try to get session from query, otherwise use active transport
    let transport = transports.get(req.query.sessionId);
    
    if (!transport) {
        if (activeTransport) {
            console.log(`[Message] No sessionId, using active transport.`);
            transport = activeTransport;
        } else {
            console.warn(`[Message] No active session found for request.`);
            return res.status(404).json({ error: "Session not found" });
        }
    }

    try {
      await transport.handlePostMessage(req, res);
    } catch (error) {
      console.error(`[Message Error]`, error);
      if (!res.headersSent) res.status(500).json({ error: "Internal server error" });
    }
  });

  // Health Check
  app.get("/health", (req, res) => {
    res.json({ status: "ok", server: config.MCP_SERVER_NAME, version: config.MCP_SERVER_VERSION });
  });

  // Webhook / Stateless Tool Execution Endpoint
  app.post("/webhook", async (req, res) => {
    const { tool: toolName, args } = req.body;
    
    if (!toolName) {
      return res.status(400).json({ error: "Missing 'tool' parameter in request body." });
    }

    const tool = tools.find(t => t.name === toolName);
    if (!tool) {
      return res.status(404).json({ error: `Tool '${toolName}' not found.` });
    }

    console.log(`[Webhook] Executing tool: ${toolName}`);
    try {
      // Result is now an MCP Standard Object: { content: [{ type: "text", text: "JSON..." }] }
      const mcpResult = await tool.handler(args || {});
      
      // Unwrap logic for HTTP clients
      if (mcpResult.content && Array.isArray(mcpResult.content) && mcpResult.content[0]?.text) {
          try {
              const rawResult = JSON.parse(mcpResult.content[0].text);
              return res.json(rawResult);
          } catch (parseError) {
              console.warn("[Webhook] Failed to parse tool response content as JSON, returning raw text.");
              return res.json({ result: mcpResult.content[0].text });
          }
      }
      
      // Fallback if structure is unexpected
      res.json(mcpResult);

    } catch (error) {
      console.error(`[Webhook Error] Tool '${toolName}' failed:`, error);
      res.status(500).json({ 
        error: `Tool execution failed`, 
        details: error.message 
      });
    }
  });

  const port = config.PORT || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`
┌──────────────────────────────────────────────────┐
│  🚀 MCP Server (Simplified Global Mode)         │
├──────────────────────────────────────────────────┤
│  Port:    ${port.toString().padEnd(38)} │
│  SSE:     /sse                                   │
│  Auth:    DISABLED                               │
└──────────────────────────────────────────────────┘
    `);
  });
}

main().catch((error) => {
  console.error("[Fatal] Server failed to start:", error);
  process.exit(1);
});