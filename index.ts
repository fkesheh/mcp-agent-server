#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { closeAllAgents, createServer } from "./mcp-agent-server.js";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";

async function main() {
  // Parse arguments using yargs
  const argv = await yargs(hideBin(process.argv))
    .option("config", {
      alias: "c",
      description: "Path to JSON configuration file",
      type: "string",
    })
    .help()
    .parse();

  const transport = new StdioServerTransport();
  const { server } = await createServer(argv.config);

  await server.connect(transport);

  // Cleanup on exit
  process.on("SIGINT", async () => {
    await server.close();
    await closeAllAgents();
    process.exit(0);
  });
}

main().catch((error) => {
  console.error("Server error:", error);
  process.exit(1);
});
