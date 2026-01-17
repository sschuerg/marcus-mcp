// src/tools/optigem/optigem-tools.ts
import { queryOptigemPersons, queryOptigemPersonById } from './optigem-query.js';

export const optigemTools = [
  {
    name: 'query_optigem_persons',
    description: 'Query persons from Optigem CRM database. Supports search by name/email and staging/production mode.',
    inputSchema: {
      type: 'object',
      properties: {
        searchTerm: {
          type: 'string',
          description: 'Search term for firstname, lastname, or email (optional)'
        },
        mode: {
          type: 'string',
          enum: ['production', 'staging'],
          description: 'Database mode (default: production)'
        },
        limit: {
          type: 'number',
          description: 'Maximum number of results (default: 100)',
          default: 100
        }
      }
    },
    handler: async (args: any) => {
      const { searchTerm, mode, limit } = args;
      const result = await queryOptigemPersons(searchTerm, mode, limit);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    }
  },
  {
    name: 'query_optigem_person_by_id',
    description: 'Get a single person by ID from Optigem CRM database',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'Person ID'
        },
        mode: {
          type: 'string',
          enum: ['production', 'staging'],
          description: 'Database mode (default: production)'
        }
      },
      required: ['id']
    },
    handler: async (args: any) => {
      const { id, mode } = args;
      const result = await queryOptigemPersonById(id, mode);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify(result, null, 2)
        }]
      };
    }
  }
];
