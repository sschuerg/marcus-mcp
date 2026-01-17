// src/tools/optigem/optigem-query.ts

import { OptigemClient } from '../../services/optigem-client.js';
import { OptigemPerson, OptigemMode, OptigemApiResponse } from '../../types/optigem.types.js';

export async function queryOptigemPersons(
  searchTerm?: string,
  mode?: OptigemMode,
  limit: number = 100
): Promise<OptigemApiResponse<OptigemPerson[]>> {
  const client = new OptigemClient(mode);
  
  try {
    await client.connect();
    
    let query = `
      SELECT TOP (@param0)
        id,
        firstname,
        lastname,
        email,
        phone,
        address,
        created_at,
        updated_at
      FROM persons
    `;
    
    const params: any[] = [limit];
    
    if (searchTerm) {
      query += ` WHERE 
        firstname LIKE @param1 OR 
        lastname LIKE @param1 OR 
        email LIKE @param1
      `;
      params.push(`%${searchTerm}%`);
    }
    
    query += ` ORDER BY updated_at DESC`;
    
    const results = await client.query<OptigemPerson>(query, params);
    
    await client.disconnect();
    
    return {
      success: true,
      data: results,
      timestamp: new Date(),
    };
  } catch (error) {
    await client.disconnect();
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
  }
}

export async function queryOptigemPersonById(
  id: number,
  mode?: OptigemMode
): Promise<OptigemApiResponse<OptigemPerson>> {
  const client = new OptigemClient(mode);
  
  try {
    await client.connect();
    
    const query = `
      SELECT 
        id,
        firstname,
        lastname,
        email,
        phone,
        address,
        created_at,
        updated_at
      FROM persons
      WHERE id = @param0
    `;
    
    const results = await client.query<OptigemPerson>(query, [id]);
    
    await client.disconnect();
    
    if (results.length === 0) {
      return {
        success: false,
        error: 'Person not found',
        timestamp: new Date(),
      };
    }
    
    return {
      success: true,
      data: results[0],
      timestamp: new Date(),
    };
  } catch (error) {
    await client.disconnect();
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date(),
    };
  }
}
