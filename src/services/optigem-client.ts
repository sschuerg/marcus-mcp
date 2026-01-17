// src/services/optigem-client.ts

import sql from 'mssql';
import { OptigemConfig, OptigemMode } from '../types/optigem.types.js';
import { getOptigemConfig, validateConfig } from '../config/optigem.config.js';

export class OptigemClient {
  private pool: sql.ConnectionPool | null = null;
  private config: OptigemConfig;

  constructor(mode?: OptigemMode) {
    this.config = getOptigemConfig(mode);
    validateConfig(this.config);
  }

  async connect(): Promise<void> {
    try {
      const sqlConfig: sql.config = {
        server: this.config.host,
        database: this.config.database,
        user: this.config.user,
        password: this.config.password,
        port: this.config.port,
        options: {
          encrypt: true,
          trustServerCertificate: true, // Allow self-signed certificates
          enableArithAbort: true,
        },
        connectionTimeout: this.config.connectionTimeout,
        requestTimeout: this.config.requestTimeout,
        pool: {
          min: 2,
          max: 10,
          idleTimeoutMillis: 30000,
        },
      };

      this.pool = await new sql.ConnectionPool(sqlConfig).connect();
      console.log(`✅ Connected to Optigem ${this.config.mode} database`);
    } catch (error) {
      console.error(`❌ Failed to connect to Optigem ${this.config.mode}:`, error);
      throw error;
    }
  }

  async query<T>(queryString: string, params?: any[]): Promise<T[]> {
    if (!this.pool) {
      throw new Error('Database not connected. Call connect() first.');
    }

    try {
      const request = this.pool.request();
      
      // Add parameters safely
      if (params) {
        params.forEach((param, index) => {
          request.input(`param${index}`, param);
        });
      }

      const result = await request.query(queryString);
      return result.recordset as T[];
    } catch (error) {
      console.error('Query error:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.pool) {
      await this.pool.close();
      this.pool = null;
      console.log(`✅ Disconnected from Optigem ${this.config.mode}`);
    }
  }

  isConnected(): boolean {
    return this.pool !== null && this.pool.connected;
  }

  getMode(): OptigemMode {
    return this.config.mode;
  }
}
