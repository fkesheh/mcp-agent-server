import { AIAgent, Servers } from "mcp-ai-agent";
import { openai } from "@ai-sdk/openai";
import { z } from "zod";

// The sequential thinking agent
const sequentialThinkingAgent = new AIAgent({
  name: "Sequential Thinker",
  description:
    "Use this agent to think sequentially and resolve complex problems",
  toolsConfigs: [
    {
      mcpServers: {
        sequentialThinking: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-sequential-thinking"],
        },
      },
    },
  ],
  model: openai("gpt-4o-mini"),
});

// The brave search agent
const braveSearchAgent = new AIAgent({
  name: "Brave Search",
  description: "Use this agent to search the web for the latest information",
  toolsConfigs: [Servers.braveSearch],
  model: openai("gpt-4o-mini"),
});

// The memory agent
const memoryAgent = new AIAgent({
  name: "Memory Agent",
  description:
    "Use this agent to store and retrieve memories. Pass a full prompt to the agent with all the context it will need to store and retrieve memories.",
  systemPrompt:
    "If the use asks to store something use the create_entities tool. If the user asks to retrieve something use the read_graph tool.",
  model: openai("gpt-4o-mini"),
  toolsConfigs: [
    {
      mcpServers: {
        memory: {
          command: "npx",
          args: ["-y", "@modelcontextprotocol/server-memory"],
        },
      },
    },
  ],
});

// The master agent that can manage other agents
const masterAgent = new AIAgent({
  name: "Master Agent",
  description: "An agent that can manage other agents",
  model: openai("gpt-4o-mini"),
  toolsConfigs: [
    {
      type: "agent",
      agent: sequentialThinkingAgent,
    },
    {
      type: "agent",
      agent: memoryAgent,
    },
    {
      type: "agent",
      agent: braveSearchAgent,
    },
  ],
});

const calculatorAgent = new AIAgent({
  name: "Calculator Agent",
  description: "A calculator agent",
  toolsConfigs: [
    {
      type: "tool",
      name: "multiply",
      description: "A tool for multiplying two numbers",
      parameters: z.object({
        number1: z.number(),
        number2: z.number(),
      }),
      execute: async (args) => {
        return args.number1 * args.number2;
      },
    },
    {
      type: "tool",
      name: "add",
      description: "A tool for adding two numbers",
      parameters: z.object({
        number1: z.number(),
        number2: z.number(),
      }),
      execute: async (args) => {
        return args.number1 + args.number2;
      },
    },
    {
      type: "tool",
      name: "subtract",
      description: "A tool for subtracting two numbers",
      parameters: z.object({
        number1: z.number(),
        number2: z.number(),
      }),
      execute: async (args) => {
        return args.number1 - args.number2;
      },
    },
    {
      type: "tool",
      name: "divide",
      description: "A tool for dividing two numbers",
      parameters: z.object({
        number1: z.number(),
        number2: z.number(),
      }),
      execute: async (args) => {
        return args.number1 / args.number2;
      },
    },
  ],
});

export const agents: AIAgent[] = [
  sequentialThinkingAgent,
  memoryAgent,
  braveSearchAgent,
  masterAgent,
  calculatorAgent,
];
