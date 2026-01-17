import { N8nService } from '../n8nService.js';

const n8nService = new N8nService();

export const importWorkflowTools = [
  {
    name: 'import_workflow',
    description: 'Import and repair a workflow JSON. Removes old IDs, credentials, and updates URLs for new environment.',
    inputSchema: {
      type: 'object',
      properties: {
        workflow: {
          type: 'object',
          description: 'Complete workflow JSON object'
        },
        update_urls: {
          type: 'boolean',
          description: 'Update dmgint URLs to localhost (default: true)'
        },
        remove_credentials: {
          type: 'boolean',
          description: 'Remove credential references (default: true)'
        }
      },
      required: ['workflow']
    },
    handler: async (args) => {
      const workflow = args.workflow;
      const updateUrls = args.update_urls !== false;
      const removeCreds = args.remove_credentials !== false;

      console.log(`[ImportWorkflow] Importing: ${workflow.name}`);
      console.log(`[ImportWorkflow] Original nodes: ${workflow.nodes?.length || 0}`);

      // Fix 1: Remove old IDs
      delete workflow.id;
      delete workflow.versionId;
      if (workflow.meta) {
        delete workflow.meta.instanceId;
      }

      // Fix 2: Remove credentials
      let credsRemoved = 0;
      if (removeCreds && workflow.nodes) {
        workflow.nodes.forEach(node => {
          if (node.credentials) {
            delete node.credentials;
            credsRemoved++;
          }
        });
      }

      // Fix 3: Update URLs
      let urlsUpdated = 0;
      if (updateUrls && workflow.nodes) {
        workflow.nodes.forEach(node => {
          if (node.parameters) {
            const paramsStr = JSON.stringify(node.parameters);
            const updated = paramsStr
              .replace(/https:\/\/n8n\.dmgint\.de/g, 'http://localhost:5678')
              .replace(/n8n\.dmgint\.de/g, 'localhost:5678');
            
            if (paramsStr !== updated) {
              urlsUpdated++;
              node.parameters = JSON.parse(updated);
            }
          }
        });
      }

      // Fix 4: Set inactive
      workflow.active = false;

      // Fix 5: Update name
      if (!workflow.name.startsWith('🔧')) {
        workflow.name = '🔧 ' + workflow.name;
      }

      console.log(`[ImportWorkflow] Credentials removed: ${credsRemoved}`);
      console.log(`[ImportWorkflow] URLs updated: ${urlsUpdated}`);

      // Create in n8n
      try {
        const result = await n8nService.createWorkflow(
          workflow.name,
          workflow.nodes,
          workflow.connections,
          workflow.settings
        );

        return {
          success: true,
          id: result.id,
          name: result.name,
          nodes_imported: workflow.nodes.length,
          credentials_removed: credsRemoved,
          urls_updated: urlsUpdated,
          url: `http://localhost:5678/workflow/${result.id}`,
          next_steps: [
            'Configure Microsoft OAuth2 credentials',
            'Configure Google Gemini API key',
            'Verify SharePoint Site IDs',
            'Test workflow execution'
          ]
        };
      } catch (error) {
        return {
          success: false,
          error: error.message,
          workflow_name: workflow.name,
          nodes_count: workflow.nodes.length
        };
      }
    }
  }
];
