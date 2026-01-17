import { N8nService } from '../n8nService.js';
import { config } from '../env.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Pfad zur Library im Container (/app/library) oder lokal
// Da wir in dist/tools sind, müssen wir hoch navigieren.
// Im Container: /app/dist/tools -> /app/library
const LIBRARY_PATH = path.resolve(__dirname, '../../library');

const n8nService = new N8nService();

// --- HELPER ---

async function loadAndPrepareWorkflow(filename: string, replacements: Record<string, string>): Promise<any> {
    const filePath = path.join(LIBRARY_PATH, filename);
    
    if (!fs.existsSync(filePath)) {
        throw new Error(`Workflow template not found: ${filename} (Path: ${filePath})`);
    }

    let content = fs.readFileSync(filePath, 'utf-8');

    // Replace all placeholders
    for (const [key, value] of Object.entries(replacements)) {
        // Global replace of {{KEY}}
        content = content.replaceAll(`{{${key}}}`, value);
    }

    try {
        return JSON.parse(content);
    } catch (e: any) {
        throw new Error(`Failed to parse workflow JSON ${filename}: ${e.message}`);
    }
}

async function ensureCredential(type: 'openrouter' | 'optigem'): Promise<string> {
    const CRED_NAME_OR = "Marcus-OpenRouter-Key";
    const CRED_NAME_OPTI = "Marcus-Optigem-SQL";

    if (type === 'openrouter') {
        if (!config.OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY missing");
        
        // Try find
        try {
            // @ts-ignore
            const list = await n8nService.client.get('/credentials');
            const found = list.data.data.find((c: any) => c.name === CRED_NAME_OR);
            if (found) return found.id;
        } catch (e) {}

        // Create
        const payload = {
            name: CRED_NAME_OR,
            type: "httpHeaderAuth",
            data: { name: "Authorization", value: `Bearer ${config.OPENROUTER_API_KEY}` }
        };
        // @ts-ignore
        const res = await n8nService.client.post('/credentials', payload);
        return res.data.id;
    } 
    
    if (type === 'optigem') {
        if (!process.env.OPTIGEM_PROD_HOST) throw new Error("OPTIGEM_PROD_HOST missing");

        try {
            // @ts-ignore
            const list = await n8nService.client.get('/credentials');
            const found = list.data.data.find((c: any) => c.name === CRED_NAME_OPTI);
            if (found) return found.id;
        } catch (e) {}

        const payload = {
            name: CRED_NAME_OPTI,
            type: "microsoftSql",
            data: {
                server: process.env.OPTIGEM_PROD_HOST,
                database: process.env.OPTIGEM_PROD_DB,
                user: process.env.OPTIGEM_PROD_USER,
                password: process.env.OPTIGEM_PROD_PASS,
                port: 1433,
                encrypt: true
            }
        };
        // @ts-ignore
        const res = await n8nService.client.post('/credentials', payload);
        return res.data.id;
    }

    throw new Error("Unknown credential type");
}

// --- TOOLS ---

export const agentDeploymentTools = [
  {
    name: 'sync_n8n_credentials',
    description: 'Reads secrets from MCP environment and creates/updates Credentials in n8n.',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      let log = "";
      try {
        const idOR = await ensureCredential('openrouter');
        log += `✅ Credential 'Marcus-OpenRouter-Key' synced! ID: ${idOR}\n`;
      } catch (err: any) {
        log += `❌ OpenRouter Sync failed: ${err.message}\n`;
      }

      try {
        const idOpti = await ensureCredential('optigem');
        log += `✅ Credential 'Marcus-Optigem-SQL' synced! ID: ${idOpti}\n`;
      } catch (err: any) {
        log += `⚠️ Optigem Sync skipped/failed: ${err.message}\n`;
      }

      return { content: [{ type: 'text', text: log }] };
    }
  },
  {
    name: 'deploy_mcp_agent',
    description: 'Deploys a specialized AI Agent or Tool as a native n8n Workflow.',
    inputSchema: {
      type: 'object',
      properties: {
        agentType: {
          type: 'string',
          enum: ['workflow_analyzer', 'general_assistant', 'optigem_query', 'n8n_search', 'troubleshooter'],
          description: 'The type of agent/tool to deploy'
        }
      },
      required: ['agentType']
    },
    handler: async (args: any) => {
      const { agentType } = args;
      const baseUrlClean = config.N8N_BASE_URL.replace(/\/api\/v1\/?$/, '');
      
      let filename = "";
      let replacements: Record<string, string> = {};

      try {
          if (agentType === 'workflow_analyzer') {
            filename = "MCP-Agent-Workflow-Analyzer.json";
            const credId = await ensureCredential('openrouter');
            replacements = {
                "CREDENTIAL_ID_OPENROUTER": credId
            };
          } else if (agentType === 'general_assistant') {
            filename = "MCP-Agent-General-Assistant.json";
            const credId = await ensureCredential('openrouter');
            replacements = {
                "CREDENTIAL_ID_OPENROUTER": credId
            };
          } else if (agentType === 'troubleshooter') {
            filename = "MCP-Agent-Troubleshooter.json";
            const credId = await ensureCredential('openrouter');
            replacements = {
                "CREDENTIAL_ID_OPENROUTER": credId
            };
          } else if (agentType === 'optigem_query') {
            filename = "MCP-Tool-Optigem-Query.json";
            const credId = await ensureCredential('optigem');
            replacements = {
                "CREDENTIAL_ID_OPTIGEM": credId
            };
          } else if (agentType === 'n8n_search') {
            filename = "MCP-Tool-N8n-Search.json";
            // No extra creds needed, uses API Key from env inside n8n expression if configured
            replacements = {}; 
          } else {
            return { content: [{ type: 'text', text: `Unknown agent type: ${agentType}` }] };
          }

          // Load and Prepare
          console.log(`[Deploy] Loading template ${filename}...`);
          const workflowData = await loadAndPrepareWorkflow(filename, replacements);

          // Deploy logic
          const existing = await n8nService.listWorkflows();
          const found = existing.data.find((w: any) => w.name === workflowData.name);

          let result;
          if (found) {
             console.log(`[Deploy] Updating existing agent ${found.id}...`);
             result = await n8nService.updateWorkflow(found.id, workflowData.name, workflowData.nodes, workflowData.connections);
          } else {
             console.log(`[Deploy] Creating new agent...`);
             result = await n8nService.createWorkflow(workflowData.name, workflowData.nodes, workflowData.connections);
          }
          
          if (result.id) {
              await n8nService.activateWorkflow(result.id, true);
          }

          return {
            content: [{
              type: 'text',
              text: `✅ Tool '${workflowData.name}' deployed successfully!\nID: ${result.id}` 
            }]
          };

      } catch (err: any) {
        console.error(err);
        return { content: [{ type: 'text', text: `Deployment failed: ${err.message}` }] };
      }
    }
  }
];