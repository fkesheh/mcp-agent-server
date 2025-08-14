# MCP Agent Server

A Model Context Protocol (MCP) hub that seamlessly connects AI clients with intelligent agents, enabling powerful cross-platform communication across multiple AI ecosystems.

## Overview

MCP Agent Server creates a bridge between MCP-compatible clients (like Claude Desktop, VS Code, Cursor, etc.) and specialized AI agents. It enables you to:

- Create and configure multiple specialized agents with different capabilities
- Connect these agents to your MCP clients
- Compose agents into master agents for complex workflows
- Build AI applications with advanced capabilities MCP servers

This project leverages the [mcp-ai-agent](https://github.com/fkesheh/mcp-ai-agent) framework to simplify agent creation and management.

## Features

- **Multiple Agent Support**: Create and manage different specialized agents
- **Agent Composition**: Combine specialized agents into master agents
- **Custom Tool Integration**: Create your own tools or use existing MCP servers
- **Preconfigured Servers**: Easy access to popular MCP servers like Sequential Thinking, Brave Search, and Memory
- **AI SDK Integration**: Support for 17+ LLM providers including OpenAI, Anthropic, Google (Generative AI & Vertex), Amazon Bedrock, Azure, Cohere, Mistral, Fireworks, Groq, Perplexity, Together AI, xAI, DeepSeek, Cerebras, DeepInfra, and Replicate through Vercel AI SDK v5

## Prerequisites

- Node.js (v16+) installed
- An API key for your chosen AI model provider (OpenAI, Anthropic, Google, etc.)
- Any API keys required by specific MCP servers you want to use

## Installation

### Option 1: Using npx (Recommended)

You can run MCP Agent Server directly using npx without installation:

```bash
# Start the server with default configuration
npx mcp-agent-server

# Start with custom configuration
npx mcp-agent-server --config my-config.json

# Test an agent
npx mcp-agent-server test-agent --name "Sequential Thinker" --prompt "What is 2+2?"
```

### Option 2: Global Installation

Install globally to use the `mcp-agent-server` command anywhere:

```bash
npm install -g mcp-agent-server

# Then use it
mcp-agent-server --config my-config.json
```

### Option 3: Local Development

1. Clone the repository:

   ```bash
   git clone <repository-url>
   cd mcp-agent-server
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Build the project:

   ```bash
   npm run build
   ```

## Configuration

### Configure Your Agents

The MCP Agent Server now uses JSON-based configuration for easier management and deployment. You can create a personalized agents configuration file named `my-agents-config.json` in the project root. The server automatically detects and uses this file if it exists.

To create your custom configuration:

1. Create a new file called `my-agents-config.json` in the project root
2. Define your agents with their tools, models, and configurations using JSON format
3. The server will automatically load and use your configuration

### JSON Configuration Schema

Here's an example of a custom agents configuration:

```json
{
  "version": "1.0.0",
  "agents": [
    {
      "name": "Code Context Agent",
      "description": "Use this agent to analyze and understand code in your projects",
      "model": {
        "provider": "anthropic",
        "model": "claude-3-5-haiku-20241022"
      },
      "toolsConfigs": [
        {
          "prebuilt": "sequentialThinking"
        },
        {
          "mcpServers": {
            "codeContext": {
              "command": "node",
              "args": ["/path/to/code-context-mcp/dist/index.js"]
            }
          }
        }
      ]
    },
    {
      "name": "Web Search Agent",
      "description": "Use this agent to search the web",
      "systemPrompt": "Prefer to use brave search to search the web for information.",
      "model": {
        "provider": "anthropic",
        "model": "claude-3-5-haiku-20241022"
      },
      "toolsConfigs": [
        {
          "prebuilt": "sequentialThinking"
        },
        {
          "prebuilt": "braveSearch"
        }
      ]
    },
    {
      "name": "Master Agent",
      "description": "An agent that can manage other agents",
      "model": {
        "provider": "openai",
        "model": "gpt-4o-mini"
      },
      "toolsConfigs": [
        {
          "agentRef": "Code Context Agent"
        },
        {
          "agentRef": "Web Search Agent"
        }
      ]
    }
  ]
}
```

### Configuration Options

#### Model Configuration

- **provider**: The AI provider to use. Supported providers include:
  - `"openai"` - OpenAI models (GPT-4, GPT-4o, etc.)
  - `"anthropic"` - Anthropic Claude models
  - `"google"` - Google Generative AI (Gemini models)
  - `"vertex"` - Google Vertex AI
  - `"bedrock"` - Amazon Bedrock
  - `"azure"` - Azure OpenAI Service
  - `"cohere"` - Cohere models
  - `"mistral"` - Mistral AI models
  - `"fireworks"` - Fireworks AI
  - `"groq"` - Groq (ultra-fast inference)
  - `"perplexity"` - Perplexity AI
  - `"togetherai"` - Together AI
  - `"xai"` - xAI (Grok models)
  - `"deepseek"` - DeepSeek models
  - `"cerebras"` - Cerebras inference
  - `"deepinfra"` - DeepInfra
  - `"replicate"` - Replicate (open source models)
- **model**: The specific model name (e.g., `"gpt-4o-mini"`, `"claude-3-5-haiku-20241022"`, `"gemini-2.0-flash-exp"`)
- **apiKey**: (Optional) API key for the provider. Can also be set via environment variables

#### Tools Configuration Types

1. **Prebuilt Servers** (recommended):

   ```json
   {
     "prebuilt": "sequentialThinking"
   }
   ```

   Available prebuilt servers: `sequentialThinking`, `memory`, `braveSearch`, `firecrawlMcp`, `fetch`, `awsKbRetrieval`, `everart`, `fileSystem`, `sqlite`

2. **Custom MCP Servers**:

   ```json
   {
     "mcpServers": {
       "serverName": {
         "command": "node",
         "args": ["/path/to/server.js"],
         "env": {
           "API_KEY": "your-api-key"
         }
       }
     }
   }
   ```

3. **Agent References** (for master agents):

   ```json
   {
     "agentRef": "Other Agent Name"
   }
   ```

4. **Imported Agents** (for using external agent files):

   ```json
   {
     "type": "import",
     "importPath": "/path/to/your/agent-file.js",
     "exportName": "createResearchAgent",
     "factoryArgs": {
       "modelProvider": "anthropic",
       "modelName": "claude-3-5-haiku-20241022",
       "includeMemory": true
     }
   }
   ```

   This allows you to import agents from TypeScript/JavaScript files created with the `mcp-ai-agent` library. The imported file can export:

   - A pre-configured agent instance
   - A factory function that creates an agent (with optional arguments)
   - An async factory function for complex initialization

### Selective Agent Exposure

You can control which agents are exposed to MCP clients using the `expose` boolean field on each agent. This is useful when you want to have helper agents that are only used internally by other agents:

```json
{
  "version": "1.0.0",
  "agents": [
    {
      "name": "Web Search Helper",
      "description": "Internal web search capabilities",
      "model": { "provider": "openai", "model": "gpt-4o-mini" },
      "toolsConfigs": [{ "prebuilt": "braveSearch" }],
      "expose": false
    },
    {
      "name": "Master Assistant",
      "description": "Public-facing assistant with web search",
      "model": {
        "provider": "anthropic",
        "model": "claude-3-5-haiku-20241022"
      },
      "toolsConfigs": [
        { "prebuilt": "sequentialThinking" },
        { "agentRef": "Web Search Helper" }
      ],
      "expose": true
    }
  ]
}
```

- **`expose: true`** (default): Agent is available as a tool in MCP clients
- **`expose: false`**: Agent is only available internally to other agents

### Specifying Configuration File

You can specify a custom configuration file using the `--config` argument:

```bash
# Using CLI
npm run test-agent -- --config="path/to/config.json" --name="Agent Name" --prompt="Test prompt"

# When starting the server (multiple formats supported)
node dist/index.js --config=path/to/config.json
node dist/index.js -c path/to/config.json
node dist/index.js --config path/to/config.json
```

You can include as many specialized agents as needed, such as:

- Code analysis agents
- Development environment agents
- Knowledge base agents (Obsidian, etc.)
- Project management agents (Jira, etc.)
- Google Drive/Workspace agents
- Web search agents
- Design tool agents (Figma, etc.)

> **Important**: After creating or updating your custom configuration, remember to:
>
> 1. Run `npm run build` to rebuild the project
> 2. Restart your MCP client to apply changes

### Default Configuration

The server comes with a default `agents-config.json` that includes:

1. **Sequential Thinking Agent**: For complex problem solving
2. **Brave Search Agent**: For web searching
3. **Memory Agent**: For storing and retrieving information
4. **Master Agent**: Combines multiple agents

> **Important**: After making changes to your agent configurations, remember to:
>
> 1. Run `npm run build` to rebuild the project
> 2. Restart your Claude client to apply changes
> 3. On Windows, you may need to completely close Claude using Task Manager (Ctrl+Alt+Del) as it can continue running in the background

### Example Agent Configuration

```json
{
  "version": "1.0.0",
  "agents": [
    {
      "name": "Sequential Thinker",
      "description": "Use this agent to think sequentially and resolve complex problems",
      "model": {
        "provider": "openai",
        "model": "gpt-4o-mini"
      },
      "toolsConfigs": [
        {
          "mcpServers": {
            "sequentialThinking": {
              "command": "npx",
              "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
            }
          }
        }
      ]
    },
    {
      "name": "Claude Assistant",
      "description": "A powerful AI assistant using Claude's capabilities",
      "model": {
        "provider": "anthropic",
        "model": "claude-3-5-sonnet-20241022"
      },
      "toolsConfigs": [
        {
          "mcpServers": {
            "memory": {
              "command": "npx",
              "args": ["-y", "@modelcontextprotocol/server-memory"]
            }
          }
        }
      ]
    },
    {
      "name": "Master Agent",
      "description": "An agent that can manage other agents",
      "model": {
        "provider": "openai",
        "model": "gpt-4o-mini"
      },
      "toolsConfigs": [
        {
          "agentRef": "Sequential Thinker"
        },
        {
          "agentRef": "Memory Agent"
        },
        {
          "agentRef": "Brave Search Agent"
        }
      ]
    }
  ]
}
```

> **Note**: The mcp-ai-agent framework supports various AI models through the [AI SDK](https://sdk.vercel.ai/providers/ai-sdk-providers). You can use models from providers such as OpenAI, Anthropic, Google Generative AI, Mistral, Groq, and many others. Check the [AI SDK Providers documentation](https://sdk.vercel.ai/providers/ai-sdk-providers) for the complete list of supported models and their capabilities.

## Connecting to MCP Clients

Add the MCP Agent Server to your MCP client configuration:

### Claude Desktop

Edit your `claude_desktop_config.json`:

#### Using npx (Recommended)

```json
{
  "mcpServers": {
    "mcp-agent-server": {
      "command": "npx",
      "args": ["mcp-agent-server", "--config", "/path/to/your/config.json"]
    }
  }
}
```

#### Using Global Installation

```json
{
  "mcpServers": {
    "mcp-agent-server": {
      "command": "mcp-agent-server",
      "args": ["--config", "/path/to/your/config.json"],
      "env": {
        "OPENAI_API_KEY": "your-openai-api-key",
        "BRAVE_API_KEY": "your-brave-api-key",
        "ANTHROPIC_API_KEY": "your-anthropic-api-key"
      }
    }
  }
}
```

#### Using Local Build

```json
{
  "mcpServers": {
    "mcp-agent-server": {
      "command": "node",
      "args": [
        "/full/path/to/mcp-agent-server/dist/index.js",
        "--config",
        "/path/to/your/config.json"
      ],
      "env": {
        "OPENAI_API_KEY": "your-openai-api-key",
        "BRAVE_API_KEY": "your-brave-api-key",
        "ANTHROPIC_API_KEY": "your-anthropic-api-key"
      }
    }
  }
}
```

> **Important**: After making changes to `claude_desktop_config.json`, remember to:
>
> 1. Restart your Claude client to apply changes
> 2. On Windows, you may need to completely close Claude using Task Manager (Ctrl+Alt+Del) as it can continue running in the background

### VS Code / Cursor / Other MCP Clients

Follow the specific client's instructions for adding MCP servers, using:

- **Command**: `node`
- **Args**: `["/full/path/to/mcp-agent-server/dist/index.js"]`

## Using Your Agents

Once configured, your agents will appear as tools in your MCP client. For example, in Claude Desktop, you can use them by:

1. Typing `/` to view available tools
2. Selecting one of your configured agents
3. Following the prompts to provide context and a specific task

## Advanced Configuration

### Custom Tools

For custom functionality, you have several options:

1. **Use Prebuilt Servers** (recommended): Choose from available prebuilt servers like `sequentialThinking`, `memory`, `braveSearch`, `fetch`, etc.

2. **Create Custom MCP Servers**: Build your own MCP server and integrate it:

```json
{
  "name": "Calculator Agent",
  "description": "A calculator agent with custom math operations",
  "model": {
    "provider": "openai",
    "model": "gpt-4o-mini"
  },
  "toolsConfigs": [
    {
      "mcpServers": {
        "calculator": {
          "command": "node",
          "args": ["/path/to/your/calculator-mcp-server.js"]
        }
      }
    }
  ]
}
```

3. **Combine Multiple Prebuilt Servers**: Mix and match existing servers for complex functionality:

```json
{
  "name": "Multi-Tool Agent",
  "description": "An agent with multiple capabilities",
  "model": {
    "provider": "anthropic",
    "model": "claude-3-5-haiku-20241022"
  },
  "toolsConfigs": [
    {
      "prebuilt": "sequentialThinking"
    },
    {
      "prebuilt": "memory"
    },
    {
      "prebuilt": "fetch"
    }
  ]
}
```

### Importing External Agents

You can import agents from external files. See example: [@fkesheh/mcp-ai-agent-example/exportable-agent.ts](https://github.com/fkesheh/mcp-ai-agent-example/blob/main/src/exportable-agent.ts)

#### 1. Create Agent File

```typescript
// my-agent.ts
import { AIAgent, Servers } from "mcp-ai-agent";
import { openai } from "@ai-sdk/openai";

export const myAgent = new AIAgent({
  name: "My Custom Agent",
  description: "A custom agent",
  model: openai("gpt-4o-mini"),
  toolsConfigs: [Servers.sequentialThinking],
});
```

#### 2. Build to JavaScript

```bash
npx tsc  # Creates my-agent.js in dist/ folder
```

#### 3. Use in Configuration

```json
{
  "type": "import",
  "importPath": "/full/path/to/dist/my-agent.js",
  "exportName": "myAgent"
}
```

**Important**: Always use absolute paths to compiled `.js` files.

### Using MCP Servers

The mcp-ai-agent framework supports various MCP servers:

- Sequential Thinking: For breaking down complex problems
- Memory: For persistent storage of information
- Brave Search: For web searches
- And many more...

## Troubleshooting

- If agents fail to initialize, check that the MCP servers are correctly configured
- For "npx" commands, ensure the full path is specified if needed
- Verify all required API keys are available in your environment
- Check that the MCP client is correctly configured to use the MCP Agent Server

## Development

1. Make changes to the TypeScript files
2. Rebuild with `npm run build`
3. Restart your MCP client to load the changes

## CLI Usage

MCP Agent Server comes with a command-line interface (CLI) for working with agents.

### Testing Agents

You can test individual agents directly from the command line without connecting to an MCP client, this is helpful for debugging purposes.

#### Using npx (Recommended)

```bash
npx mcp-agent-server test-agent --config="/path/to/config.json" --name="Agent Name" --prompt="Your test prompt" --context="Optional context"
```

For example, to test the Brave Search Agent:

```bash
npx mcp-agent-server test-agent --config="./agents-config.json" --name="Brave Search" --prompt="What is the capital of France?" --context="I need geographical information"
```

Or test the Master Agent which combines multiple specialized agents:

```bash
npx mcp-agent-server test-agent --config="./my-agents-config.json" --name="Master Agent" --prompt="Store this information: Claude is an AI assistant by Anthropic" --context="I need to test the memory capabilities"
```

> **Note**: If no `--config` is specified, the server will look for `agents-config.json` or `my-agents-config.json` in the current directory.

#### Using Local Development

```bash
npm run test-agent -- --config="path/to/config.json" --name="Agent Name" --prompt="Your test prompt" --context="Optional context"
```

Or run the command directly:

```bash
node dist/cli.js test-agent --config="./agents-config.json" --name="Sequential Thinker" --prompt="How would I approach solving a complex math problem?"
```

The test command will:

1. Find the specified agent by name
2. Initialize the agent
3. Send your prompt and context
4. Display the agent's response

This is useful for:

- Testing new agent configurations
- Debugging agent issues
- Verifying agent functionality before connecting to an MCP client

The test command will list all available agents if you provide an invalid agent name.

## License

This project is licensed under the MIT License.
