# MCP Agent Server

A Model Context Protocol (MCP) hub that seamlessly connects AI clients with intelligent agents, enabling powerful cross-platform communication across multiple AI ecosystems.

## Overview

MCP Agent Server creates a bridge between MCP-compatible clients (like Claude Desktop, VS Code, Cursor, etc.) and specialized AI agents. It enables you to:

- Create and configure multiple specialized agents with different capabilities
- Connect these agents to your MCP clients
- Compose agents into master agents for complex workflows
- Build AI applications with advanced capabilities through tools and MCP servers

This project leverages the [mcp-ai-agent](https://github.com/fkesheh/mcp-ai-agent) framework to simplify agent creation and management.

## Features

- **Multiple Agent Support**: Create and manage different specialized agents
- **Agent Composition**: Combine specialized agents into master agents
- **Custom Tool Integration**: Create your own tools or use existing MCP servers
- **Preconfigured Servers**: Easy access to popular MCP servers like Sequential Thinking, Brave Search, and Memory
- **AI SDK Integration**: Support for multiple LLM providers including OpenAI, Anthropic, Google, Mistral, Groq and others through Vercel AI SDK

## Prerequisites

- Node.js (v16+) installed
- An API key for your chosen AI model provider (OpenAI, Anthropic, Google, etc.)
- Any API keys required by specific MCP servers you want to use

## Installation

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

4. Get the full path to the generated `dist/index.js` file:
   ```bash
   pwd
   # Example output: /Users/username/Projects/mcp-agent-server
   # Full path would be: /Users/username/Projects/mcp-agent-server/dist/index.js
   ```

## Configuration

### Configure Your Agents

Edit `agents-config.ts` to define your agents. Several example agents are included:

1. **Sequential Thinking Agent**: For complex problem solving
2. **Brave Search Agent**: For web searching
3. **Memory Agent**: For storing and retrieving information
4. **Master Agent**: Combines multiple agents
5. **Calculator Agent**: Provides basic calculation tools

> **Important**: After making changes to your agent configurations, remember to:
>
> 1. Run `npm run build` to rebuild the project
> 2. Restart your Claude client to apply changes
> 3. On Windows, you may need to completely close Claude using Task Manager (Ctrl+Alt+Del) as it can continue running in the background

### Example Agent Configuration

```typescript
// Creating a specialized agent
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

// Creating a Claude-powered agent
import { anthropic } from "@ai-sdk/anthropic";

const claudeAgent = new AIAgent({
  name: "Claude Assistant",
  description: "A powerful AI assistant using Claude's capabilities",
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
  // Using Claude's latest Sonnet model
  model: anthropic("claude-3-7-sonnet-20250219"),
});

// Creating a master agent that uses multiple specialized agents
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
```

> **Note**: The mcp-ai-agent framework supports various AI models through the [AI SDK](https://sdk.vercel.ai/providers/ai-sdk-providers). You can use models from providers such as OpenAI, Anthropic, Google Generative AI, Mistral, Groq, and many others. Check the [AI SDK Providers documentation](https://sdk.vercel.ai/providers/ai-sdk-providers) for the complete list of supported models and their capabilities.

## Connecting to MCP Clients

Add the MCP Agent Server to your MCP client configuration:

### Claude Desktop

Edit your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "mcp-agent-server": {
      "command": "node",
      "args": ["/full/path/to/mcp-agent-server/dist/index.js"]
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

You can create custom tools directly in your agent configuration:

```typescript
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
    // Add more tools...
  ],
});
```

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

You can test individual agents directly from the command line without connecting to an MCP client, this is helpful for debuging purposes.

```bash
npm run test-agent -- --name="Agent Name" --prompt="Your test prompt" --context="Optional context"
```

For example, to test the Brave Search Agent:

```bash
npm run test-agent -- --name="Brave Search" --prompt="What is the capital of France?" --context="I need geographical information"
```

You can also run the command directly:

```bash
node dist/index.js test-agent --name="Sequential Thinker" --prompt="How would I approach solving a complex math problem?"
```

Or test the Master Agent which combines multiple specialized agents:

```bash
node dist/index.js test-agent --name="Master Agent" --prompt="Store this information: Claude is an AI assistant by Anthropic" --context="I need to test the memory capabilities"
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
