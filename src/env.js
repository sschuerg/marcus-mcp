import 'dotenv/config';

/**
 * Configuration management
 * All sensitive keys are expected to be provided via environment variables
 * (e.g., from docker/secrets/secrets.env)
 */
export const config = {
  PORT: process.env.PORT || '3000',
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
  N8N_API_KEY: process.env.N8N_API_KEY,
  N8N_BASE_URL: process.env.N8N_API_BASE_URL || process.env.N8N_BASE_URL || 'https://n8n.inri-consulting.de/api/v1',
  MCP_SERVER_NAME: process.env.MCP_SERVER_NAME || 'MARCUS',
  MCP_SERVER_VERSION: process.env.MCP_SERVER_VERSION || '1.1.0',
  MCP_BEARER_TOKEN: process.env.MCP_BEARER_TOKEN || process.env.MCP_N8N_AGENT_TOKEN
};

if (!config.N8N_API_KEY) {
  console.warn("WARNING: N8N_API_KEY is not defined in the environment.");
}
