#!/usr/bin/env node
import { RoamServer } from './server/roam-server.js';
import { RestServer } from './server/rest-server.js';

async function main() {
  const roamServer = new RoamServer();
  const restServer = new RestServer(roamServer);
  
  // Start both servers
  await Promise.all([
    roamServer.run(),
    restServer.start(3000)
  ]);
}

main().catch(console.error);
