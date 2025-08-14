// Types for JSON configuration schema

export interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface ToolsConfig {
  type?: "tool" | "agent" | "mcpServers" | "prebuilt" | "import";

  // For prebuilt servers (e.g., "sequentialThinking", "braveSearch")
  prebuilt?: string;

  // For custom MCP servers
  mcpServers?: Record<string, MCPServerConfig>;

  // For custom tools (inline tool definition)
  name?: string;
  description?: string;
  parameters?: any;
  execute?: string; // Function body as string for JSON

  // For agent references
  agentRef?: string; // Reference to another agent by name

  // For importing external agents from files
  importPath?: string; // Path to the TypeScript/JavaScript file
  exportName?: string; // Name of the export (default: "default")
  factoryArgs?: any; // Arguments to pass to the agent factory function
}

export interface ModelConfig {
  provider:
    | "openai"
    | "anthropic"
    | "google"
    | "vertex"
    | "bedrock"
    | "azure"
    | "cohere"
    | "mistral"
    | "fireworks"
    | "groq"
    | "perplexity"
    | "togetherai"
    | "xai"
    | "deepseek"
    | "cerebras"
    | "deepinfra"
    | "replicate";
  model: string;
  apiKey?: string; // Optional, can be from env
}

export interface AgentConfig {
  name: string;
  description: string;
  systemPrompt?: string;
  model: ModelConfig;
  toolsConfigs: ToolsConfig[];
  expose?: boolean;
}

export interface JSONAgentsConfig {
  version: string;
  agents: AgentConfig[];
}

// Available prebuilt servers
export const PREBUILT_SERVERS = [
  "sequentialThinking",
  "memory",
  "braveSearch",
  "firecrawlMcp",
  "fetch",
  "awsKbRetrieval",
  "everart",
  "fileSystem",
  "sqlite",
] as const;

export type PrebuiltServerType = (typeof PREBUILT_SERVERS)[number];
