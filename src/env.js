import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env
dotenv.config({ path: join(__dirname, '../.env') });

// Load secrets.env (overrides .env)
dotenv.config({ path: join(__dirname, '../secrets.env') });

export const config = {
  PORT: process.env.PORT || '3000',
  MCP_SERVER_NAME: process.env.MCP_SERVER_NAME || 'MARCUS',
  MCP_SERVER_VERSION: process.env.MCP_SERVER_VERSION || '1.0.0',
  // Prefer N8N_API_BASE_URL (from secrets.env), fallback to N8N_BASE_URL or default
  N8N_BASE_URL: process.env.N8N_API_BASE_URL || process.env.N8N_BASE_URL || 'http://localhost:5678',
  N8N_API_KEY: process.env.N8N_API_KEY || '',
  MCP_BEARER_TOKEN: process.env.MCP_BEARER_TOKEN || '',
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
  LLM_MODEL_CODING: process.env.LLM_MODEL_CODING || 'qwen/qwen-2.5-coder-32b-instruct',
};

console.log('✅ Config loaded:', {
  PORT: config.PORT,
  MCP_SERVER_NAME: config.MCP_SERVER_NAME,
  N8N_BASE_URL: config.N8N_BASE_URL,
  N8N_API_KEY: config.N8N_API_KEY ? '***' + config.N8N_API_KEY.slice(-4) : 'NOT SET',
  MCP_BEARER_TOKEN: config.MCP_BEARER_TOKEN ? 'SET' : 'NOT SET',
  OPENROUTER_API_KEY: config.OPENROUTER_API_KEY ? 'SET' : 'NOT SET',
  LLM_MODEL_CODING: config.LLM_MODEL_CODING
});
