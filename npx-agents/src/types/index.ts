export interface Agent {
  description: string;
  name?: string;
  mode?: 'primary' | 'subagent' | 'all';
  model?: string;
  temperature?: number;
  maxSteps?: number;
  color?: string;
  trigger?: string;
  hidden?: boolean;
  tools?: {
    read?: boolean;
    write?: boolean;
    edit?: boolean;
    bash?: boolean | string;
    glob?: boolean | string;
    grep?: boolean | string;
    task?: boolean;
    skill?: boolean;
    [key: string]: boolean | string | undefined;
  };
  permission?: {
    bash?: Record<string, 'allow' | 'deny' | 'ask'>;
    edit?: 'allow' | 'deny' | 'ask';
    write?: 'allow' | 'deny' | 'ask';
    skill?: Record<string, 'allow' | 'deny'>;
    task?: Record<string, 'allow' | 'deny'>;
    [key: string]: unknown;
  };
  mcp?: {
    servers?: Array<{
      name: string;
      command: string;
      args?: string[];
    }>;
  };
  version?: string;
  source?: string;
}

export interface AgentManifest {
  agents: Agent[];
  source: string;
  ref?: string;
}

export interface AgentFile {
  path: string;
  agent: Agent;
  content: string;
}

export interface Config {
  global: boolean;
  agents: Record<string, string[]>;
  updates: {
    check: 'daily' | 'weekly' | 'manual';
  };
}

export type AgentPlatform = 
  | 'opencode' 
  | 'claude-code' 
  | 'cursor' 
  | 'windsurf' 
  | 'cline' 
  | 'roo' 
  | 'codex' 
  | 'continue';

export interface InstallOptions {
  source: string;
  global: boolean;
  platforms: AgentPlatform[];
  agentName?: string;
  copy: boolean;
  yes: boolean;
}
