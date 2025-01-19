import fs from 'fs';
import yaml from 'js-yaml';
import { toolSchemas } from './schemas.js';

interface OpenApiSpec {
  openapi: string;
  info: {
    title: string;
    version: string;
    description: string;
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: {
    [key: string]: {
      get?: any;
      post?: any;
    };
  };
  components: {
    schemas: {
      Tool: {
        type: string;
        properties: {
          name: { type: string };
          description: { type: string };
          parameters: {
            type: string;
            additionalProperties: boolean;
          };
        };
      };
    };
  };
}

function generateOpenAPI() {
  const openApiSpec: OpenApiSpec = {
    openapi: '3.0.0',
    info: {
      title: 'Roam Research Tools API',
      version: '1.0.0',
      description: 'API for interacting with Roam Research tools',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Local development server',
      },
    ],
    paths: {
      '/tools': {
        get: {
          summary: 'List all available tools',
          operationId: 'toolsGet',
          responses: {
            '200': {
              description: 'List of available tools',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      tools: {
                        type: 'array',
                        items: {
                          $ref: '#/components/schemas/Tool',
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    components: {
      schemas: {
        Tool: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            parameters: {
              type: 'object',
              additionalProperties: true,
            },
          },
        },
      },
    },
  };

  // Add paths for each tool
  for (const [toolName, schema] of Object.entries(toolSchemas)) {
    const path = `/tools/${toolName}` as string;
    openApiSpec.paths[path] = {
      post: {
        summary: schema.description,
        operationId: `tools${toolName}Post`,
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: schema.inputSchema,
            },
          },
        },
        responses: {
          '200': {
            description: 'Successful operation',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    data: {
                      type: 'object',
                      additionalProperties: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    };
  }

  // Convert to YAML
  const yamlStr = yaml.dump(openApiSpec, {
    indent: 2,
    lineWidth: -1, // Don't wrap lines
    noRefs: false, // Preserve references
  });

  // Write to file
  fs.writeFileSync('src/api/openapi.yaml', yamlStr, 'utf8');
  console.log('OpenAPI specification generated successfully!');
}

generateOpenAPI(); 