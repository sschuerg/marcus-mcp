// src/types/optigem.types.ts

export type OptigemMode = 'staging' | 'production';

export interface OptigemConfig {
  mode: OptigemMode;
  host: string;
  database: string;
  user: string;
  password: string;
  port: number;
  connectionTimeout: number;
  requestTimeout: number;
}

export interface OptigemPerson {
  id: number;
  firstname: string | null;
  lastname: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  created_at: Date | null;
  updated_at: Date | null;
}

export interface OptigemEvent {
  projectNumber: string;
  title: string;
  startDate: Date;
  endDate: Date | null;
  location: string | null;
}

export interface OptigemQueryParams {
  mode?: OptigemMode;
  limit?: number;
  offset?: number;
}

export interface OptigemApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  timestamp: Date;
}
