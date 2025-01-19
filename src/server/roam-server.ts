import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ErrorCode,
  ListToolsRequestSchema,
  McpError,
} from '@modelcontextprotocol/sdk/types.js';
import { initializeGraph, type Graph } from '@roam-research/roam-api-sdk';
import { API_TOKEN, GRAPH_NAME } from '../config/environment.js';
import { toolSchemas } from '../tools/schemas.js';
import { ToolHandlers } from '../tools/tool-handlers.js';

export class RoamServer {
  private server: Server;
  private toolHandlers: ToolHandlers;
  private graph: Graph;

  constructor() {
    this.graph = initializeGraph({
      token: API_TOKEN,
      graph: GRAPH_NAME,
    });

    this.toolHandlers = new ToolHandlers(this.graph);
    
    this.server = new Server(
      {
        name: 'roam-research',
        version: '0.17.0',
      },
      {
          capabilities: {
            tools: {
              roam_remember: {},
              roam_recall: {},
              roam_add_todo: {},
              roam_fetch_page_by_title: {},
              roam_create_page: {},
              roam_create_block: {},
              roam_import_markdown: {},
              roam_create_outline: {},
              roam_search_for_tag: {},
              roam_search_by_status: {},
              roam_search_block_refs: {},
              roam_search_hierarchy: {},
              find_pages_modified_today: {},
              roam_search_by_text: {},
              roam_update_block: {},
              roam_update_blocks: {},
              roam_search_by_date: {},
              roam_datomic_query: {}
            },
          },
      }
    );

    this.setupRequestHandlers();
    
    // Error handling
    this.server.onerror = (error) => { /* handle error silently */ };
    process.on('SIGINT', async () => {
      await this.server.close();
      process.exit(0);
    });
  }

  private setupRequestHandlers() {
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return this.listTools();
    });

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      try {
        return this.executeTool(request.params.name, request.params.arguments);
      } catch (error: unknown) {
        if (error instanceof McpError) {
          throw error;
        }
        const errorMessage = error instanceof Error ? error.message : String(error);
        throw new McpError(
          ErrorCode.InternalError,
          `Roam API error: ${errorMessage}`
        );
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }

  async listTools() {
    return {
      tools: Object.values(toolSchemas),
    };
  }

  async executeTool(toolName: string, args: unknown) {
    try {
      const result = await this.handleToolCall(toolName, args);
      return result;
    } catch (error: unknown) {
      if (error instanceof McpError) {
        throw error;
      }
      const errorMessage = error instanceof Error ? error.message : String(error);
      throw new McpError(
        ErrorCode.InternalError,
        `Roam API error: ${errorMessage}`
      );
    }
  }

  private async handleToolCall(toolName: string, args: unknown) {
    console.log(`Handling tool call: ${toolName} with args: ${JSON.stringify(args)}`);
    
    switch (toolName) {
      case 'roam_remember': {
        const { memory, categories } = args as {
          memory: string;
          categories?: string[];
        };
        const result = await this.toolHandlers.remember(memory, categories);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'roam_fetch_page_by_title': {
        const { title } = args as { title: string };
        const content = await this.toolHandlers.fetchPageByTitle(title);
        return {
          content: [{ type: 'text', text: content }],
        };
      }

      case 'roam_create_page': {
        const { title, content } = args as { 
          title: string; 
          content?: string 
        };
        const result = await this.toolHandlers.createPage(title, content);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'roam_create_block': {
        const { content, page_uid, title } = args as {
          content: string;
          page_uid?: string;
          title?: string;
        };
        const result = await this.toolHandlers.createBlock(content, page_uid, title);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'roam_import_markdown': {
        const { 
          content,
          page_uid,
          page_title,
          parent_uid,
          parent_string,
          order = 'first'
        } = args as {
          content: string;
          page_uid?: string;
          page_title?: string;
          parent_uid?: string;
          parent_string?: string;
          order?: 'first' | 'last';
        };
        const result = await this.toolHandlers.importMarkdown(
          content,
          page_uid,
          page_title,
          parent_uid,
          parent_string,
          order
        );
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'roam_add_todo': {
        const { todos } = args as { todos: string[] };
        const result = await this.toolHandlers.addTodos(todos);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'roam_create_outline': {
        const { outline, page_title_uid, block_text_uid } = args as {
          outline: Array<{text: string | undefined; level: number}>;
          page_title_uid?: string;
          block_text_uid?: string;
        };
        const result = await this.toolHandlers.createOutline(
          outline,
          page_title_uid,
          block_text_uid
        );
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'roam_search_for_tag': {
        const { primary_tag, page_title_uid, near_tag } = args as {
          primary_tag: string;
          page_title_uid?: string;
          near_tag?: string;
        };
        const result = await this.toolHandlers.searchForTag(primary_tag, page_title_uid, near_tag);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'roam_search_by_status': {
        const { status, page_title_uid, include, exclude } = args as {
          status: 'TODO' | 'DONE';
          page_title_uid?: string;
          include?: string;
          exclude?: string;
        };
        const result = await this.toolHandlers.searchByStatus(status, page_title_uid, include, exclude);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'roam_search_block_refs': {
        const params = args as {
          block_uid?: string;
          page_title_uid?: string;
        };
        const result = await this.toolHandlers.searchBlockRefs(params);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'roam_search_hierarchy': {
        const params = args as {
          parent_uid?: string;
          child_uid?: string;
          page_title_uid?: string;
          max_depth?: number;
        };
        const result = await this.toolHandlers.searchHierarchy(params);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'find_pages_modified_today': {
        const result = await this.toolHandlers.findPagesModifiedToday();
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'roam_search_by_text': {
        const params = args as {
          text: string;
          page_title_uid?: string;
        };
        const result = await this.toolHandlers.searchByText(params);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'roam_search_by_date': {
        const params = args as {
          start_date: string;
          end_date?: string;
          type: 'created' | 'modified' | 'both';
          scope: 'blocks' | 'pages' | 'both';
          include_content: boolean;
        };
        const result = await this.toolHandlers.searchByDate(params);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'roam_update_block': {
        const { block_uid, content, transform_pattern } = args as {
          block_uid: string;
          content?: string;
          transform_pattern?: {
            find: string;
            replace: string;
            global?: boolean;
          };
        };

        let result;
        if (content) {
          result = await this.toolHandlers.updateBlock(block_uid, content);
        } else if (transform_pattern) {
          result = await this.toolHandlers.updateBlock(
            block_uid,
            undefined,
            (currentContent: string) => {
              const regex = new RegExp(transform_pattern.find, transform_pattern.global !== false ? 'g' : '');
              return currentContent.replace(regex, transform_pattern.replace);
            }
          );
        }
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'roam_recall': {
        const result = await this.toolHandlers.recall();
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'roam_update_blocks': {
        const { updates } = args as {
          updates: Array<{
            block_uid: string;
            content?: string;
            transform?: {
              find: string;
              replace: string;
              global?: boolean;
            };
          }>;
        };
        
        const result = await this.toolHandlers.updateBlocks(updates);
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      case 'roam_datomic_query': {
        const { query, inputs } = args as {
          query: string;
          inputs?: unknown[];
        };
        const result = await this.toolHandlers.executeDatomicQuery({ query, inputs });
        return {
          content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
      }

      default:
        throw new McpError(
          ErrorCode.MethodNotFound,
          `Unknown tool: ${toolName}`
        );
    }
  }
}
