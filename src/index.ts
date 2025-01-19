#!/usr/bin/env node
import { RoamServer } from './server/roam-server.js';
import { RestServer } from './server/rest-server.js';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

async function main() {
  const roamServer = new RoamServer();
  const restServer = new RestServer(roamServer);
  
  // Start both servers
  await Promise.all([
    roamServer.run(),
    restServer.start(PORT)
  ]);
}

main().catch(console.error);
