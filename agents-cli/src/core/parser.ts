import matter from 'gray-matter';
import type { Agent, AgentFile } from '../types/index.js';

// Agent 特有字段，用于区分 Agent 和 Skill
const AGENT_SPECIFIC_FIELDS = [
  'mode',
  'model',
  'temperature',
  'maxSteps',
  'color',
  'trigger',
  'tools',
  'permission',
  'mcp',
];

/**
 * 判断一个 markdown 文件内容是 Agent 还是 Skill
 * 如果 frontmatter 中包含任何 Agent 特有字段，则认为是 Agent
 */
export function isAgentContent(content: string): boolean {
  try {
    const { data } = matter(content);
    return AGENT_SPECIFIC_FIELDS.some(field => field in data);
  } catch {
    return false;
  }
}

export function parseAgentFile(content: string, path: string): AgentFile | null {
  const { data, content: body } = matter(content);
  
  // 如果不是 Agent 文件（是 Skill 文件），返回 null
  if (!isAgentContent(content)) {
    return null;
  }
  
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

export function parseAgentFromString(content: string, filename: string): AgentFile | null {
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
