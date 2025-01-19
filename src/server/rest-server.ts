import express from 'express';
import { RoamServer } from './roam-server.js';
import { McpError, ErrorCode } from '@modelcontextprotocol/sdk/types.js';

export class RestServer {
  private app: express.Application;
  private roamServer: RoamServer;

  constructor(roamServer: RoamServer) {
    this.app = express();
    this.roamServer = roamServer;
    
    this.app.use(express.json());
    this.setupRoutes();
  }

  private setupRoutes() {
    // List tools endpoint
    this.app.get('/tools', async (req, res) => {
      try {
        const tools = await this.roamServer.listTools();
        res.json({ tools });
      } catch (error) {
        this.handleError(error, res);
      }
    });

    // Execute tool endpoint
    this.app.post('/tools/:toolName', async (req, res) => {
      try {
        const toolName = req.params.toolName;
        console.log(`Executing tool: ${toolName} with args: ${JSON.stringify(req.body)}`);
        const result = await this.roamServer.executeTool(toolName, req.body);
        res.json(result);
      } catch (error) {
        this.handleError(error, res);
      }
    });
  }

  private handleError(error: unknown, res: express.Response) {
    if (error instanceof McpError) {
      switch (error.code) {
        case ErrorCode.MethodNotFound:
          res.status(404).json({ error: error.message });
          break;
        case ErrorCode.InvalidRequest:
          res.status(400).json({ error: error.message });
          break;
        default:
          res.status(500).json({ error: error.message });
      }
    } else {
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Internal server error' 
      });
    }
  }

  async start(port: number = 3000) {
    return new Promise<void>((resolve) => {
      this.app.listen(port, () => {
        console.log(`REST API server listening on port ${port}`);
        resolve();
      });
    });
  }
} 