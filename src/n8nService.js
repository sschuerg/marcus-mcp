import axios from 'axios';
import { config } from './env.js';
import Debug from 'debug';

const debug = Debug('mcp:n8n');

export class N8nService {
  constructor() {
    this.client = axios.create({
      baseURL: config.N8N_BASE_URL,
      headers: {
        'X-N8N-API-KEY': config.N8N_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    // Request Interceptor for logging
    this.client.interceptors.request.use(req => {
        debug(`[REQ] ${req.method?.toUpperCase()} ${req.url}`);
        return req;
    });

    // Response Interceptor for logging
    this.client.interceptors.response.use(
        res => {
            debug(`[RES] ${res.status} ${res.config.url}`);
            return res;
        },
        err => {
            debug(`[ERR] ${err.response?.status || 'N/A'} ${err.config?.url || 'Unknown'}: ${err.message}`);
            return Promise.reject(err);
        }
    );
  }

  async createWorkflow(name, nodes, connections, settings = {}) {
    debug(`createWorkflow: ${name}`);
    try {
      const payload = { name, nodes, connections, settings };
      const response = await this.client.post('/workflows', payload);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  async listWorkflows() {
    debug(`listWorkflows`);
    try {
      const response = await this.client.get('/workflows');
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  async getWorkflow(id) {
    debug(`getWorkflow: ${id}`);
    try {
      const response = await this.client.get(`/workflows/${id}`);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  async updateWorkflow(id, name, nodes, connections, settings = {}) {
    debug(`updateWorkflow: ${id}`);
    try {
      const payload = { name, nodes, connections, settings };
      const response = await this.client.put(`/workflows/${id}`, payload);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  async deleteWorkflow(id) {
    debug(`deleteWorkflow: ${id}`);
    try {
      const response = await this.client.delete(`/workflows/${id}`);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  async activateWorkflow(id, active = true) {
    debug(`activateWorkflow: ${id} -> ${active}`);
    try {
        try {
            // Standard n8n v1 way
            const response = await this.client.patch(`/workflows/${id}`, { active });
            return response.data;
        } catch (patchError) {
            // Fallback for restricted environments
            if (patchError.response?.status === 405 || patchError.response?.status === 400) {
                console.warn(`[N8nService] API restricted: Cannot change 'active' state via PATCH/PUT for ${id}. This is common in some self-hosted n8n setups.`);
                return { warning: 'Manual activation required in n8n UI' };
            }
            throw patchError;
        }
    } catch (error) {
        this._handleError(error);
    }
  }

  async executeWorkflow(id, data = {}) {
    debug(`executeWorkflow: ${id}`);
    try {
      const response = await this.client.post(`/workflows/${id}/execute`, { data });
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  async getExecutions(workflowId, limit = 5) {
    debug(`getExecutions: ${workflowId || 'all'} (limit: ${limit})`);
    try {
      const params = { limit, includeData: true };
      if (workflowId) params.workflowId = workflowId;
      const response = await this.client.get('/executions', { params });
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  async getExecution(id) {
    debug(`getExecution: ${id}`);
    try {
      const response = await this.client.get(`/executions/${id}`);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  async getCredential(id) {
    debug(`getCredential: ${id}`);
    try {
      const response = await this.client.get(`/credentials/${id}`);
      return response.data;
    } catch (error) {
      // this._handleError(error);
      return null;
    }
  }

  async createCredential(name, type, data) {
    debug(`createCredential: ${name} (${type})`);
    try {
      const payload = { name, type, data };
      const response = await this.client.post('/credentials', payload);
      return response.data;
    } catch (error) {
      this._handleError(error);
    }
  }

  async listCredentials() {
    debug(`listCredentials`);
    try {
      const response = await this.client.get('/credentials');
      return response.data;
    } catch (error) {
      // Robustness: Return null on failure instead of throwing
      console.warn(`[N8nService] listCredentials failed (non-fatal): ${error.message}`);
      return null;
    }
  }

  async getNodeTypes() {
    debug(`getNodeTypes`);
    try {
        const response = await this.client.get('/node-types');
        return response.data;
    } catch (error) {
        // Robustness: Return null on failure
        console.warn(`[N8nService] getNodeTypes failed (non-fatal): ${error.message}`);
        return null;
    }
  }

  async searchNodeTypes(query) {
      debug(`searchNodeTypes: ${query}`);
      try {
          const allNodes = await this.getNodeTypes();
          
          if (!allNodes) return []; // Robustness: Return empty list if fetch failed
          
          const nodesList = Array.isArray(allNodes) ? allNodes : (allNodes.data || []);
          
          if (!query) return nodesList;
          
          const lowerQuery = query.toLowerCase();
          return nodesList.filter(node => 
              (node.displayName && node.displayName.toLowerCase().includes(lowerQuery)) ||
              (node.name && node.name.toLowerCase().includes(lowerQuery))
          );
      } catch (error) {
          // Robustness: Return empty list
          console.warn(`[N8nService] searchNodeTypes failed (non-fatal): ${error.message}`);
          return [];
      }
  }

  async getNodeDetails(nodeTypeName) {
      debug(`getNodeDetails: ${nodeTypeName}`);
      try {
          const allNodes = await this.getNodeTypes();
          
          if (!allNodes) return null; // Robustness
          
          const nodesList = Array.isArray(allNodes) ? allNodes : (allNodes.data || []);
          return nodesList.find(node => node.name === nodeTypeName);
      } catch (error) {
           console.warn(`[N8nService] getNodeDetails failed (non-fatal): ${error.message}`);
           return null;
      }
  }

  _handleError(error) {
    const data = error.response?.data;
    let msg = data?.message || error.message;
    
    // Add nested n8n error details if available
    if (data?.hint) msg += ` (Hint: ${data.hint})`;
    if (data?.details) msg += ` (Details: ${JSON.stringify(data.details)})`;
    
    // Log full error to debug, but simple message to console
    debug(`API Error Detail:`, error.response?.data || error);
    console.error(`[N8nService] Error: ${msg}`);
    throw new Error(`N8n API Error: ${msg}`);
  }
}
