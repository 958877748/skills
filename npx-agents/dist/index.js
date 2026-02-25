#!/usr/bin/env node
var __require = /* @__PURE__ */ ((x) => typeof require !== "undefined" ? require : typeof Proxy !== "undefined" ? new Proxy(x, {
  get: (a, b) => (typeof require !== "undefined" ? require : a)[b]
}) : x)(function(x) {
  if (typeof require !== "undefined") return require.apply(this, arguments);
  throw Error('Dynamic require of "' + x + '" is not supported');
});

// src/index.ts
import { Command } from "../node_modules/commander/esm.mjs";

// src/commands/add.ts
import ora from "../node_modules/ora/index.js";

// src/core/installer.ts
import { join as join3, basename as basename3 } from "path";
import { existsSync as existsSync3, readdirSync as readdirSync3, readFileSync as readFileSync3, copyFileSync as copyFileSync2, symlinkSync as symlinkSync2, rmSync as rmSync2 } from "fs";
import { tmpdir } from "os";
import { mkdtempSync } from "fs";

// src/core/parser.ts
import matter from "../node_modules/gray-matter/index.js";
function parseAgentFile(content, path) {
  const { data, content: body } = matter(content);
  if (!data.description) {
    throw new Error(`Agent at ${path} is missing required "description" field in frontmatter`);
  }
  const agent = {
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
    version: data.version
  };
  return {
    path,
    agent,
    content: body.trim()
  };
}

// src/core/discover.ts
import { join as join2, basename as basename2 } from "path";
import { existsSync as existsSync2, readFileSync as readFileSync2 } from "fs";

// src/utils/filesystem.ts
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync, symlinkSync, copyFileSync, rmSync, statSync } from "fs";
import { join, dirname } from "path";
import { homedir } from "os";
function ensureDir(dir) {
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
}
function isDirectory(path) {
  return existsSync(path) && statSync(path).isDirectory();
}
function getPlatformPaths(platform, global) {
  const home = homedir();
  const paths = {
    "opencode": {
      project: [".opencode/agents/"],
      global: [join(home, ".config", "opencode", "agents")]
    },
    "claude-code": {
      project: [".claude/agents/"],
      global: [join(home, ".claude", "agents")]
    },
    "cursor": {
      project: [".cursor/agents/"],
      global: [join(home, ".cursor", "agents")]
    },
    "windsurf": {
      project: [".windsurf/agents/"],
      global: [join(home, ".codeium", "windsurf", "agents")]
    },
    "cline": {
      project: [".cline/agents/"],
      global: [join(home, ".cline", "agents")]
    },
    "roo": {
      project: [".roo/agents/"],
      global: [join(home, ".roo", "agents")]
    },
    "codex": {
      project: [".codex/agents/"],
      global: [join(home, ".codex", "agents")]
    },
    "continue": {
      project: [".continue/agents/"],
      global: [join(home, ".continue", "agents")]
    }
  };
  return global ? paths[platform].global : paths[platform].project;
}
function findFiles(dir, pattern) {
  const results = [];
  if (!existsSync(dir)) {
    return results;
  }
  const files = readdirSync(dir);
  for (const file of files) {
    const fullPath = join(dir, file);
    if (isDirectory(fullPath)) {
      results.push(...findFiles(fullPath, pattern));
    } else if (pattern.test(file)) {
      results.push(fullPath);
    }
  }
  return results;
}
function detectPlatforms() {
  const platforms = [];
  const home = homedir();
  const cwd = process.cwd();
  const checks = [
    {
      platform: "opencode",
      check: () => existsSync(join(home, ".config", "opencode")) || existsSync(join(cwd, ".opencode"))
    },
    {
      platform: "claude-code",
      check: () => existsSync(join(home, ".claude")) || existsSync(join(cwd, ".claude"))
    },
    {
      platform: "cursor",
      check: () => existsSync(join(home, ".cursor")) || existsSync(join(cwd, ".cursor"))
    },
    {
      platform: "windsurf",
      check: () => existsSync(join(home, ".codeium", "windsurf")) || existsSync(join(cwd, ".windsurf"))
    },
    {
      platform: "cline",
      check: () => existsSync(join(home, ".cline")) || existsSync(join(cwd, ".cline"))
    },
    {
      platform: "roo",
      check: () => existsSync(join(home, ".roo")) || existsSync(join(cwd, ".roo"))
    },
    {
      platform: "codex",
      check: () => existsSync(join(home, ".codex")) || existsSync(join(cwd, ".codex"))
    },
    {
      platform: "continue",
      check: () => existsSync(join(home, ".continue")) || existsSync(join(cwd, ".continue"))
    }
  ];
  for (const check of checks) {
    if (check.check()) {
      platforms.push(check.platform);
    }
  }
  if (platforms.length === 0) {
    platforms.push("opencode");
  }
  return platforms;
}

// src/core/discover.ts
var SEARCH_DIRECTORIES = [
  "",
  "agents",
  ".agents",
  ".opencode/agents",
  "src/agents"
];
var PRIORITY_FILES = [
  "AGENTS.md",
  "SKILL.md",
  "AGENT.md"
];
async function discoverFromDirectory(dir) {
  const agents = [];
  for (const subDir of SEARCH_DIRECTORIES) {
    const searchDir = subDir ? join2(dir, subDir) : dir;
    if (!existsSync2(searchDir)) continue;
    const mdFiles = findFiles(searchDir, /\.md$/);
    for (const file of mdFiles) {
      const fileName = basename2(file);
      if (fileName.startsWith(".")) continue;
      if (fileName === "README.md") continue;
      try {
        const content = readFileSync2(file, "utf-8");
        const agentFile = parseAgentFile(content, file);
        agents.push(agentFile);
      } catch (err) {
        continue;
      }
    }
  }
  for (const fileName of PRIORITY_FILES) {
    const priorityFile = join2(dir, fileName);
    if (existsSync2(priorityFile)) {
      try {
        const content = readFileSync2(priorityFile, "utf-8");
        const agentFile = parseAgentFile(content, priorityFile);
        const exists = agents.some((a) => a.path === agentFile.path);
        if (!exists) {
          agents.unshift(agentFile);
        }
      } catch (err) {
        continue;
      }
    }
  }
  return agents;
}

// src/utils/logger.ts
import chalk from "../node_modules/chalk/source/index.js";
var logger = {
  info: (msg) => console.log(chalk.blue("\u2139"), msg),
  success: (msg) => console.log(chalk.green("\u2713"), msg),
  warn: (msg) => console.log(chalk.yellow("\u26A0"), msg),
  error: (msg) => console.error(chalk.red("\u2717"), msg),
  debug: (msg) => {
    if (process.env.DEBUG === "npx-agents") {
      console.log(chalk.gray("[debug]"), msg);
    }
  }
};

// src/core/installer.ts
async function installAgent(options) {
  const { source, global, platforms, agentName, copy } = options;
  logger.info(`Installing agent from: ${source}`);
  const tempDir = await fetchSource(source);
  try {
    const agents = await discoverFromDirectory(tempDir);
    if (agents.length === 0) {
      throw new Error("No agents found in the source");
    }
    for (const platform of platforms) {
      const targetPaths = getPlatformPaths(platform, global);
      for (const targetPath of targetPaths) {
        ensureDir(targetPath);
        for (const agentFile of agents) {
          const name = agentName || agentFile.agent.name || basename3(agentFile.path, ".md");
          const finalPath = join3(targetPath, `${name}.md`);
          if (existsSync3(finalPath) && !options.yes) {
            logger.warn(`Agent "${name}" already exists at ${finalPath}`);
            continue;
          }
          if (copy) {
            const sourcePath = agentFile.path;
            if (isDirectory(sourcePath)) {
              copyDirectory(sourcePath, join3(targetPath, name));
            } else {
              copyFileSync2(sourcePath, finalPath);
            }
            logger.success(`Copied agent "${name}" to ${finalPath}`);
          } else {
            const sourceDir = tempDir;
            try {
              symlinkSync2(sourceDir, finalPath, "dir");
              logger.success(`Symlinked agent "${name}" to ${finalPath}`);
            } catch (err) {
              logger.warn(`Failed to create symlink, copying instead: ${err}`);
              copyDirectory(sourceDir, join3(targetPath, name));
              logger.success(`Copied agent "${name}" to ${targetPath}`);
            }
          }
        }
      }
    }
  } finally {
    if (existsSync3(tempDir) && tempDir.startsWith(tmpdir())) {
      rmSync2(tempDir, { recursive: true, force: true });
    }
  }
}
async function fetchSource(source) {
  if (source.startsWith(".") || source.startsWith("/") || /^[a-zA-Z]:\\/.test(source)) {
    return source;
  }
  const degit = await import("../node_modules/degit/dist/index.js");
  const tempDir = mkdtempSync(join3(tmpdir(), "npx-agents-"));
  const parts = source.split("/");
  let owner = parts[0];
  let repo = parts[1]?.replace(/#.+$/, "") || "";
  let ref = "";
  if (source.includes("#")) {
    const [repoPart, refPart] = source.split("#");
    repo = repoPart.split("/")[1];
    ref = refPart;
  }
  try {
    const target = ref ? `${owner}/${repo}#${ref}` : `${owner}/${repo}`;
    await degit.default(target).clone(tempDir);
    return tempDir;
  } catch (err) {
    rmSync2(tempDir, { recursive: true, force: true });
    throw new Error(`Failed to fetch from ${source}: ${err}`);
  }
}
function copyDirectory(source, target) {
  ensureDir(target);
  const files = readdirSync3(source);
  for (const file of files) {
    const srcPath = join3(source, file);
    const destPath = join3(target, file);
    if (isDirectory(srcPath)) {
      copyDirectory(srcPath, destPath);
    } else {
      copyFileSync2(srcPath, destPath);
    }
  }
}
function listInstalledAgents(platform, global) {
  const agents = [];
  const paths = getPlatformPaths(platform, global);
  for (const path of paths) {
    if (!existsSync3(path)) continue;
    const mdFiles = findFiles(path, /\.md$/);
    for (const file of mdFiles) {
      try {
        const content = readFileSync3(file, "utf-8");
        const agentFile = parseAgentFile(content, file);
        agents.push(agentFile);
      } catch (err) {
        continue;
      }
    }
  }
  return agents;
}
function removeAgent(name, platform, global) {
  const paths = getPlatformPaths(platform, global);
  for (const path of paths) {
    const agentPath = join3(path, `${name}.md`);
    if (existsSync3(agentPath)) {
      rmSync2(agentPath, { recursive: true, force: true });
      logger.success(`Removed agent "${name}" from ${path}`);
      return true;
    }
    if (existsSync3(path)) {
      const entries = readdirSync3(path);
      for (const entry of entries) {
        const entryPath = join3(path, entry);
        const linkTarget = existsSync3(entryPath) ? entryPath : null;
        if (linkTarget && readlinkCheck(entryPath, name)) {
          rmSync2(entryPath, { recursive: true, force: true });
          logger.success(`Removed agent "${name}" from ${path}`);
          return true;
        }
      }
    }
  }
  return false;
}
function readlinkCheck(path, name) {
  try {
    const stat = __require("fs").lstatSync(path);
    return stat.isSymbolicLink() && path.includes(name);
  } catch {
    return false;
  }
}

// src/commands/add.ts
async function addCommand(source, options) {
  const spinner = ora("Installing agent...").start();
  try {
    let platforms;
    if (options.agent && options.agent.length > 0) {
      platforms = options.agent;
    } else {
      platforms = detectPlatforms();
    }
    const installOptions = {
      source,
      global: options.global,
      platforms,
      agentName: options.agentName,
      copy: options.copy,
      yes: options.yes
    };
    await installAgent(installOptions);
    spinner.succeed(`Successfully installed agent from ${source}`);
  } catch (err) {
    spinner.fail(`Failed to install agent: ${err instanceof Error ? err.message : String(err)}`);
    logger.error(String(err));
    process.exit(1);
  }
}

// src/commands/list.ts
import chalk2 from "../node_modules/chalk/source/index.js";
async function listCommand(options) {
  let platforms;
  if (options.agent) {
    platforms = [options.agent];
  } else {
    platforms = detectPlatforms();
  }
  const scope = options.global ? "global" : "project";
  for (const platform of platforms) {
    const agents = listInstalledAgents(platform, options.global);
    if (agents.length === 0) {
      logger.info(`No agents found for ${platform} (${scope})`);
      continue;
    }
    console.log(chalk2.bold(`
${platform} agents (${scope}):
`));
    for (const agent of agents) {
      const name = agent.agent.name || agent.path.split(/[/\\]/).pop()?.replace(".md", "") || "unknown";
      const mode = agent.agent.mode || "subagent";
      const description = agent.agent.description || "No description";
      console.log(`  ${chalk2.cyan(name)} ${chalk2.gray(`[${mode}]`)}`);
      console.log(`    ${chalk2.dim(description)}
`);
    }
  }
}

// src/commands/remove.ts
import ora2 from "../node_modules/ora/index.js";
async function removeCommand(name, options) {
  const spinner = ora2(`Removing agent "${name}"...`).start();
  try {
    let platforms;
    if (options.agent) {
      platforms = [options.agent];
    } else {
      platforms = detectPlatforms();
    }
    let removed = false;
    for (const platform of platforms) {
      const result = removeAgent(name, platform, options.global);
      if (result) {
        removed = true;
      }
    }
    if (removed) {
      spinner.succeed(`Removed agent "${name}"`);
    } else {
      spinner.warn(`Agent "${name}" not found`);
    }
  } catch (err) {
    spinner.fail(`Failed to remove agent: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}

// src/commands/init.ts
import { join as join4 } from "path";
import { existsSync as existsSync4, readFileSync as readFileSync4 } from "fs";
import { fileURLToPath } from "url";
import { dirname as dirname2 } from "path";
var __dirname = dirname2(fileURLToPath(import.meta.url));
async function initCommand(name, _options) {
  try {
    const targetName = name || "my-agent";
    const targetDir = name ? join4(process.cwd(), name) : process.cwd();
    const targetPath = join4(targetDir, `${targetName}.md`);
    if (existsSync4(targetPath)) {
      logger.error(`Agent file already exists at ${targetPath}`);
      process.exit(1);
    }
    ensureDir(targetDir);
    let template;
    const templatePath = join4(__dirname, "..", "..", "templates", "default-agent.md");
    if (existsSync4(templatePath)) {
      template = readFileSync4(templatePath, "utf-8");
    } else {
      template = getDefaultTemplate(targetName);
    }
    const fs = await import("fs");
    fs.writeFileSync(targetPath, template, "utf-8");
    logger.success(`Created agent template at ${targetPath}`);
    console.log(`
You can now edit ${targetPath} to customize your agent.`);
  } catch (err) {
    logger.error(`Failed to create agent: ${err instanceof Error ? err.message : String(err)}`);
    process.exit(1);
  }
}
function getDefaultTemplate(name) {
  return `---
description: ${name} - Add your agent description here
mode: subagent
model: anthropic/claude-3-5-sonnet-20241022
temperature: 0.7
tools:
  read: true
  write: true
  edit: true
  bash: false
  glob: true
  grep: true
  task: false
  skill: false
hidden: false
---

# ${name}

You are a custom AI agent. Describe your purpose and behavior here.

## When to Use

Describe when this agent should be invoked.

## Workflow

1. First step...
2. Second step...
3. Third step...

## Guidelines

- Add your specific guidelines here
- Be clear and concise
`;
}

// src/commands/find.ts
import chalk3 from "../node_modules/chalk/source/index.js";
async function findCommand(query, _options) {
  if (!query) {
    console.log(chalk3.bold("\nSearch for agents\n"));
    console.log("Usage: npx agents find <query>");
    console.log("\nExample:");
    console.log("  npx agents find code-review");
    console.log("  npx agents find testing");
    return;
  }
  logger.info(`Searching for agents matching "${query}"...`);
  console.log(chalk3.yellow("\nNote: Agent search functionality requires integration with skills.sh API."));
  console.log("For now, you can browse agents at: https://skills.sh\n");
  console.log(chalk3.dim("Alternatively, you can:"));
  console.log(chalk3.dim("  1. Check GitHub for agent repositories"));
  console.log(chalk3.dim('  2. Use "npx agents add <owner/repo>" to install directly'));
}

// src/commands/check.ts
import chalk4 from "../node_modules/chalk/source/index.js";
async function checkCommand() {
  logger.info("Checking for agent updates...");
  console.log(chalk4.yellow("\nNote: Update checking requires version tracking."));
  console.log("To update agents, use: npx agents add <source> --force\n");
  console.log(chalk4.dim("Add version info to your agents to enable update checking."));
}

// src/commands/update.ts
import chalk5 from "../node_modules/chalk/source/index.js";
async function updateCommand() {
  logger.info("Updating agents...");
  console.log(chalk5.yellow("\nNote: Auto-update functionality coming soon.\n"));
  console.log(chalk5.dim("To update an agent, remove it and reinstall:"));
  console.log(chalk5.dim("  npx agents remove <agent-name>"));
  console.log(chalk5.dim("  npx agents add <source>"));
}

// src/index.ts
var program = new Command();
program.name("agents").description("CLI for managing AI coding agents").version("1.0.0");
program.command("add <source>").description("Install one or more agents from a GitHub repository or local path").option("-g, --global", "Install to global directory", false).option("-a, --agent <agents...>", "Target agent platform(s)").option("--agent-name <name>", "Name for the installed agent").option("-y, --yes", "Skip confirmation", false).option("--copy", "Copy instead of symlink", false).action(addCommand);
program.command("list").description("List installed agents").option("-g, --global", "List only global agents").option("-a, --agent <agent>", "Filter by platform").action(listCommand);
program.command("remove <name>").description("Remove an installed agent").option("-g, --global", "Remove from global directory").option("-a, --agent <agent>", "Remove from specific platform").action(removeCommand);
program.command("init [name]").description("Create a new agent definition template").action(initCommand);
program.command("find [query]").description("Search for available agents").action(findCommand);
program.command("check").description("Check for updates to installed agents").action(checkCommand);
program.command("update").description("Update all installed agents to the latest version").action(updateCommand);
program.parse();
//# sourceMappingURL=index.js.map
