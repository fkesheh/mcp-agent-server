import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  ToolSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { loadAgents, toolResultsToMessage, toSnakeCase } from "./utils.js";
import { AIAgent } from "mcp-ai-agent";

let agents: AIAgent[] | undefined;

const MAX_STEPS = 100;

const ToolInputSchema = ToolSchema.shape.inputSchema;
type ToolInput = z.infer<typeof ToolInputSchema>;

const AgentCallingSchema = z.object({
  context: z
    .string()
    .describe(
      "The context to send to the agent. Add any relevant information the agent needs to know for the task."
    ),
  prompt: z.string().describe("The prompt to send to the agent"),
});

export const createServer = async () => {
  if (!agents) {
    agents = await loadAgents();
  }
  const server = new Server(
    {
      name: "mcp-agent-server",
      version: "0.0.1",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  const availableAgents = agents.map((agent) => {
    const info = agent.getInfo();
    if (!info) {
      throw new Error("Agent info not found");
    }
    return {
      ...info,
      name: "agent_" + toSnakeCase(info.name),
      ai: agent,
    };
  });

  const agentArray = availableAgents.map((agent) => agent.name);

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    const tools: Tool[] = availableAgents.map((agent) => ({
      name: agent.name,
      description: agent.description,
      inputSchema: z.toJSONSchema(AgentCallingSchema) as any,
    }));
    return { tools };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    if (agentArray.includes(name)) {
      const validatedArgs = AgentCallingSchema.parse(args);
      const { context, prompt } = validatedArgs;

      const agent = availableAgents.find((agent) => agent.name === name);

      if (!agent) {
        throw new Error(`Agent not found: ${name}`);
      }

      try {
        await agent.ai.initialize();
      } catch (error) {
        throw new Error(
          `Agent ${name} failed to initialize. Check the agent MCP servers configurations. Sometimes using 'npx' as the command to start the server is requires the full path to the command. ${error}`
        );
      }

      const progressToken = request.params._meta?.progressToken;

      let i = 0;
      const response = await agent.ai.generateResponse({
        prompt: `<Context>${context}</Context>\n<Prompt>${prompt}</Prompt>`,
        maxSteps: MAX_STEPS,
        onStepFinish: (response) => {
          if (progressToken !== undefined) {
            server.notification({
              method: "notifications/progress",
              params: {
                progress: i++,
                total: MAX_STEPS,
                progressToken,
                message: toolResultsToMessage(response.toolResults),
              },
            });
          }
        },
      });

      return {
        content: [
          {
            type: "text",
            text: response.text,
          },
        ],
      };
    }

    throw new Error(`Unknown tool: ${request.params.name}`);
  });

  return { server };
};

export async function testAgent(
  agentName: string,
  prompt: string,
  context: string
) {
  if (!agents) {
    agents = await loadAgents();
  }
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
        console.log(toolResultsToMessage(response.toolResults));
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

export async function closeAllAgents() {
  if (!agents) return;
  await Promise.all(agents.map((agent) => agent.close()));
}
