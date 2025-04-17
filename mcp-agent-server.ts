import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { agents } from "./agents-config.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
  ToolSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";
import { toSnakeCase } from "./utils.js";

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

export const createServer = () => {
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
      inputSchema: zodToJsonSchema(AgentCallingSchema) as ToolInput,
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
        onStepFinish: () => {
          if (progressToken !== undefined) {
            server.notification({
              method: "notifications/progress",
              params: {
                progress: i++,
                total: MAX_STEPS,
                progressToken,
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

  const cleanup = async () => {};

  return { server, cleanup };
};
