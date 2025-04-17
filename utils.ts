import { ToolResult } from "ai";

export function toSnakeCase(str?: string) {
  if (!str) return Math.random().toString(36).substring(2, 15);
  return str.toLowerCase().replace(/ /g, "_");
}

export const loadAgents = async () => {
  try {
    // @ts-ignore
    const agents = (await import("./my-agents-config.js"))?.agents as AIAgent[];
    if (!agents) {
      throw new Error("No agents found in my-agents-config.js");
    }
    return agents;
  } catch (error) {
    // @ts-ignore
    const agents = (await import("./agents-config.js"))?.agents as AIAgent[];
    if (!agents) {
      throw new Error("No agents found in agents-config.js");
    }
    return agents;
  }
};

export const toolResultsToMessage = (
  toolResults: ToolResult<string, any, any>[]
) => {
  return toolResults
    .map((toolResult: ToolResult<string, any, any>) => {
      return (
        toolResult.toolName +
        "(" +
        JSON.stringify(toolResult.args) +
        "): \n" +
        toolResult.result?.content?.[0]?.text?.slice(0, 200) +
        "..."
      );
    })
    .join("\n\n");
};
