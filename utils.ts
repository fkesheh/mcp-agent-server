import { LanguageModel, ToolSet, TypedToolResult } from "ai";
import { AIAgent, Servers } from "mcp-ai-agent";
import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";
import { vertex } from "@ai-sdk/google-vertex";
import { bedrock } from "@ai-sdk/amazon-bedrock";
import { azure } from "@ai-sdk/azure";
import { cohere } from "@ai-sdk/cohere";
import { mistral } from "@ai-sdk/mistral";
import { fireworks } from "@ai-sdk/fireworks";
import { groq } from "@ai-sdk/groq";
import { perplexity } from "@ai-sdk/perplexity";
import { togetherai } from "@ai-sdk/togetherai";
import { xai } from "@ai-sdk/xai";
import { deepseek } from "@ai-sdk/deepseek";
import { cerebras } from "@ai-sdk/cerebras";
import { deepinfra } from "@ai-sdk/deepinfra";
import { replicate } from "@ai-sdk/replicate";
import { z } from "zod";
import fs from "fs/promises";
import path from "path";
import {
  JSONAgentsConfig,
  AgentConfig,
  ModelConfig,
  ToolsConfig,
} from "./types.js";

export function toSnakeCase(str?: string) {
  if (!str) return Math.random().toString(36).substring(2, 15);
  return str.toLowerCase().replace(/ /g, "_");
}

function createModel(modelConfig: ModelConfig): LanguageModel {
  switch (modelConfig.provider) {
    case "openai":
      return openai(modelConfig.model);
    case "anthropic":
      return anthropic(modelConfig.model);
    case "google":
      return google(modelConfig.model);
    case "vertex":
      return vertex(modelConfig.model);
    case "bedrock":
      return bedrock(modelConfig.model);
    case "azure":
      return azure(modelConfig.model);
    case "cohere":
      return cohere(modelConfig.model);
    case "mistral":
      return mistral(modelConfig.model);
    case "fireworks":
      return fireworks(modelConfig.model);
    case "groq":
      return groq(modelConfig.model);
    case "perplexity":
      return perplexity(modelConfig.model);
    case "togetherai":
      return togetherai(modelConfig.model);
    case "xai":
      return xai(modelConfig.model);
    case "deepseek":
      return deepseek(modelConfig.model);
    case "cerebras":
      return cerebras(modelConfig.model);
    case "deepinfra":
      return deepinfra(modelConfig.model);
    case "replicate":
      return replicate.languageModel(modelConfig.model);
    default:
      throw new Error(`Unsupported model provider: ${modelConfig.provider}`);
  }
}

function mapPrebuiltServer(prebuiltName: string) {
  switch (prebuiltName) {
    case "sequentialThinking":
      return Servers.sequentialThinking;
    case "memory":
      return Servers.memory;
    case "braveSearch":
      return Servers.braveSearch;
    case "firecrawlMcp":
      return Servers.firecrawlMcp;
    case "fetch":
      return Servers.fetch;
    case "awsKbRetrieval":
      return Servers.awsKbRetrieval;
    case "everart":
      return Servers.everart;
    case "fileSystem":
      return Servers.fileSystem;
    case "sqlite":
      return Servers.sqlite;
    default:
      throw new Error(`Unknown prebuilt server: ${prebuiltName}`);
  }
}

function convertToolsConfig(
  toolConfig: ToolsConfig,
  allAgents: AIAgent[]
): any {
  if (toolConfig.prebuilt) {
    return mapPrebuiltServer(toolConfig.prebuilt);
  }

  if (toolConfig.mcpServers) {
    return { mcpServers: toolConfig.mcpServers };
  }

  if (toolConfig.agentRef) {
    const referencedAgent = allAgents.find(
      (agent) => agent.getInfo()?.name === toolConfig.agentRef
    );
    if (!referencedAgent) {
      throw new Error(`Referenced agent not found: ${toolConfig.agentRef}`);
    }
    return { type: "agent", agent: referencedAgent };
  }

  throw new Error(`Invalid tool configuration: ${JSON.stringify(toolConfig)}`);
}

async function createAgentFromConfig(
  agentConfig: AgentConfig,
  allAgents: AIAgent[]
): Promise<AIAgent> {
  const model = createModel(agentConfig.model);

  const toolsConfigs = agentConfig.toolsConfigs.map((toolConfig) =>
    convertToolsConfig(toolConfig, allAgents)
  );

  const agent = new AIAgent({
    name: agentConfig.name,
    description: agentConfig.description,
    systemPrompt: agentConfig.systemPrompt,
    model,
    toolsConfigs,
  });

  // Store the original config for access to expose flag
  (agent as any)._config = agentConfig;

  return agent;
}

export const loadAgents = async (configPath?: string): Promise<AIAgent[]> => {
  const defaultPaths = ["agents-config.json", "my-agents-config.json"];

  let configFilePath = configPath;

  if (!configFilePath) {
    for (const defaultPath of defaultPaths) {
      try {
        await fs.access(defaultPath);
        configFilePath = defaultPath;
        break;
      } catch {
        // File doesn't exist, try next
      }
    }
  }

  if (!configFilePath) {
    throw new Error(
      `No configuration file found. Tried: ${defaultPaths.join(", ")}`
    );
  }

  try {
    const configContent = await fs.readFile(configFilePath, "utf-8");
    const config: JSONAgentsConfig = JSON.parse(configContent);

    if (!config.agents || !Array.isArray(config.agents)) {
      throw new Error("Invalid configuration: 'agents' array not found");
    }

    // Create agents (we need to do this in the right order for agent references)
    const agents: AIAgent[] = [];
    const agentMap = new Map<string, AIAgent>();

    // First pass: create agents without agent references
    for (const agentConfig of config.agents) {
      const hasAgentRef = agentConfig.toolsConfigs.some(
        (tool) => tool.agentRef
      );
      if (!hasAgentRef) {
        const agent = await createAgentFromConfig(agentConfig, agents);
        agents.push(agent);
        agentMap.set(agentConfig.name, agent);
      }
    }

    // Second pass: create agents with agent references
    for (const agentConfig of config.agents) {
      const hasAgentRef = agentConfig.toolsConfigs.some(
        (tool) => tool.agentRef
      );
      if (hasAgentRef) {
        const agent = await createAgentFromConfig(agentConfig, agents);
        agents.push(agent);
        agentMap.set(agentConfig.name, agent);
      }
    }

    return agents;
  } catch (error) {
    throw new Error(
      `Failed to load configuration from ${configFilePath}: ${error}`
    );
  }
};

export const toolResultsToMessage = (
  toolResults: Array<TypedToolResult<ToolSet>>
) => {
  return toolResults
    .map((toolResult: TypedToolResult<ToolSet>) => {
      return (
        toolResult.toolName +
        "(" +
        JSON.stringify(toolResult.input) +
        "): \n" +
        toolResult.output?.content?.[0]?.text?.slice(0, 200) +
        "..."
      );
    })
    .join("\n\n");
};
