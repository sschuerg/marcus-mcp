// src/config/optigem.config.ts

import { OptigemConfig, OptigemMode } from '../types/optigem.types.js';

export const getOptigemConfig = (mode?: OptigemMode): OptigemConfig => {
  const selectedMode = mode || (process.env.OPTIGEM_DEFAULT_MODE as OptigemMode) || 'staging';
  
  if (selectedMode === 'production') {
    return {
      mode: 'production',
      host: process.env.OPTIGEM_PROD_HOST || '',
      database: process.env.OPTIGEM_PROD_DB || '',
      user: process.env.OPTIGEM_PROD_USER || '',
      password: process.env.OPTIGEM_PROD_PASSWORD || '',
      port: parseInt(process.env.OPTIGEM_PROD_PORT || '1433'),
      connectionTimeout: 30000,
      requestTimeout: 30000,
    };
  }
  
  // Default: Staging
  return {
    mode: 'staging',
    host: process.env.OPTIGEM_STAGING_HOST || '',
    database: process.env.OPTIGEM_STAGING_DB || '',
    user: process.env.OPTIGEM_STAGING_USER || '',
    password: process.env.OPTIGEM_STAGING_PASSWORD || '',
    port: parseInt(process.env.OPTIGEM_STAGING_PORT || '1433'),
    connectionTimeout: 30000,
    requestTimeout: 30000,
  };
};

export const validateConfig = (config: OptigemConfig): void => {
  if (!config.host) throw new Error('Optigem host not configured');
  if (!config.database) throw new Error('Optigem database not configured');
  if (!config.user) throw new Error('Optigem user not configured');
  if (!config.password) throw new Error('Optigem password not configured');
};
