import axios from 'axios';
import { config } from './env.js';
import Debug from 'debug';

const debug = Debug('mcp:n8n');

export class N8nService {
  constructor() {
    // Ensure we don't double-append /api/v1 if it's already in the config
    const baseURL = config.N8N_BASE_URL.endsWith('/api/v1') 
      ? config.N8N_BASE_URL 
      : `${config.N8N_BASE_URL}/api/v1`;

    this.client = axios.create({
      baseURL,
      headers: {
        'X-N8N-API-KEY': config.N8N_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(req => {
        debug(`[REQ] ${req.method?.toUpperCase()} ${req.url}`);
        return req;
    });

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
        const response = await this.client.patch(`/workflows/${id}`, { active });
        return response.data;
    } catch (error) {
        if (error.response?.status === 405 || error.response?.status === 400) {
            console.warn(`[N8nService] Cannot change active state. Manual activation required.`);
            return { warning: 'Manual activation required in n8n UI' };
        }
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

  _handleError(error) {
    const data = error.response?.data;
    let msg = data?.message || error.message;
    if (data?.hint) msg += ` (Hint: ${data.hint})`;
    if (data?.details) msg += ` (Details: ${JSON.stringify(data.details)})`;
    debug(`API Error Detail:`, error.response?.data || error);
    console.error(`[N8nService] Error: ${msg}`);
    throw new Error(`N8n API Error: ${msg}`);
  }
}
