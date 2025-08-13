#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { closeAllAgents, createServer, testAgent } from "./mcp-agent-server.js";

interface TestAgentArgs {
  name: string;
  prompt: string;
  context: string;
  config?: string;
}

export async function startServer(configPath?: string) {
  const transport = new StdioServerTransport();
  const { server } = await createServer(configPath);

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
    .option("config", {
      alias: "c",
      description: "Path to JSON configuration file",
      type: "string",
    })
    .command(["serve", "$0"], "Start the MCP agent server", {}, (argv) => {
      startServer(argv.config as string | undefined);
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
        await testAgent(argv.name, argv.prompt, argv.context, argv.config);
      }
    )
    .help()
    .parse();

  return argv;
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
