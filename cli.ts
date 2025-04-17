#!/usr/bin/env node

import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createServer } from "./mcp-agent-server.js";
import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { agents } from "./agents-config.js";
import { toSnakeCase } from "./utils.js";

interface TestAgentArgs {
  name: string;
  prompt: string;
  context: string;
}

export async function startServer() {
  const transport = new StdioServerTransport();
  const { server, cleanup } = createServer();

  await server.connect(transport);

  // Cleanup on exit
  process.on("SIGINT", async () => {
    await cleanup();
    await server.close();
    process.exit(0);
  });
}

export async function testAgent(
  agentName: string,
  prompt: string,
  context: string
) {
  // Find the agent by name
  const agent = agents.find((a) => {
    const info = a.getInfo();
    return toSnakeCase(info?.name) === toSnakeCase(agentName);
  });

  if (!agent) {
    console.error(`Agent "${agentName}" not found. Available agents:`);
    agents.forEach((a) => {
      const info = a.getInfo();
      console.log(`- ${info?.name}`);
    });
    process.exit(1);
  }

  console.log(`Testing agent: ${agent.getInfo()?.name}`);
  console.log(`Prompt: ${prompt}`);
  console.log(`Context: ${context || "None"}`);

  try {
    await agent.initialize();
    const response = await agent.generateResponse({
      prompt: `<Context>${context}</Context>\n<Prompt>${prompt}</Prompt>`,
      maxSteps: 100,
      onStepFinish: (response) => {
        console.log(
          `Step completed. Response: ${JSON.stringify(response.toolResults)}`
        );
      },
    });

    console.log("\nAgent Response:\n");
    console.log(response.text);
  } catch (error) {
    console.error("Error testing agent:", error);
    process.exit(1);
  }

  process.exit(0);
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
