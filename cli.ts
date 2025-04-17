#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { closeAllAgents, createServer, testAgent } from "./mcp-agent-server.js";

interface TestAgentArgs {
  name: string;
  prompt: string;
  context: string;
}

export async function startServer() {
  const transport = new StdioServerTransport();
  const { server } = await createServer();

  await server.connect(transport);

  // Cleanup on exit
  process.on("SIGINT", async () => {
    await server.close();
    await closeAllAgents();
    process.exit(0);
  });
}

async function main() {
  const argv = yargs(hideBin(process.argv))
    .command("serve", "Start the MCP agent server", {}, () => {
      startServer();
    })
    .command(
      "test-agent",
      "Test a specific agent",
      {
        name: {
          description: "Name of the agent to test",
          type: "string",
          demandOption: true,
        },
        prompt: {
          description: "Prompt to send to the agent",
          type: "string",
          demandOption: true,
        },
        context: {
          description: "Context to provide to the agent",
          type: "string",
          default: "",
        },
      },
      async (argv: TestAgentArgs) => {
        await testAgent(argv.name, argv.prompt, argv.context);
      }
    )
    .help()
    .demandCommand(1, "You need to specify a command")
    .parse();

  return argv;
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
