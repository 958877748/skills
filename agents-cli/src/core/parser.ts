import matter from 'gray-matter';
import type { Agent, AgentFile } from '../types/index.js';

export function parseAgentFile(content: string, path: string): AgentFile {
  const { data, content: body } = matter(content);
  
  if (!data.description) {
    throw new Error(`Agent at ${path} is missing required "description" field in frontmatter`);
  }

  const agent: Agent = {
    description: data.description,
    name: data.name,
    mode: data.mode,
    model: data.model,
    temperature: data.temperature,
    maxSteps: data.maxSteps,
    color: data.color,
    trigger: data.trigger,
    hidden: data.hidden,
    tools: data.tools,
    permission: data.permission,
    mcp: data.mcp,
    version: data.version,
  };

  return {
    path,
    agent,
    content: body.trim(),
  };
}

export function parseAgentFromString(content: string, filename: string): AgentFile {
  const baseName = filename.replace(/\.md$/, '');
  return parseAgentFile(content, baseName);
}

export function validateAgent(agent: Agent): string[] {
  const errors: string[] = [];
  
  if (!agent.description) {
    errors.push('Missing required "description" field');
  }
  
  if (agent.temperature !== undefined && (agent.temperature < 0 || agent.temperature > 1)) {
    errors.push('Temperature must be between 0 and 1');
  }
  
  if (agent.mode && !['primary', 'subagent', 'all'].includes(agent.mode)) {
    errors.push('Mode must be "primary", "subagent", or "all"');
  }
  
  return errors;
}
