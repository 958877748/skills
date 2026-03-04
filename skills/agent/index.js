import { execSync } from 'child_process';
import { writeFileSync, mkdirSync } from 'fs';

function runOpencode(prompt) {
  // 2>&1 将 stderr 合并到 stdout 一起捕获
  const output = execSync(`opencode run "${prompt}" 2>&1`, {
    encoding: 'utf-8',
    shell: true,
  });

  // 过滤所有 ANSI 转义序列（包括颜色、光标移动等）
  return output.replace(/\x1b\[[0-9;]*[a-zA-Z]/g, '');
}

function cleanOutput(response) {
  const lines = response.split('\n');
  // 从前往后找第一个包含 "Debugger attached." 的行删除（最多找5次）
  for (let i = 0; i < Math.min(5, lines.length); i++) {
    if (lines[i].includes('Debugger attached.')) {
      lines.splice(i, 1);
      break;
    }
  }
  // 从后往前找第一个包含 "Waiting for the debugger to disconnect..." 的行删除（最多找5次）
  for (let i = lines.length - 1; i >= Math.max(0, lines.length - 5); i--) {
    if (lines[i].includes('Waiting for the debugger to disconnect...')) {
      lines.splice(i, 1);
      break;
    }
  }
  return lines.join('\n');
}

function generateFileName() {
  const now = new Date();
  const timestamp = now.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .slice(0, 19); // YYYY-MM-DD_HH-mm-ss
  mkdirSync('./logs', { recursive: true });
  return `./logs/${timestamp}.md`;
}

function main() {
  // 从命令行参数获取 prompt
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error('用法: node index.js "<任务描述>"');
    process.exit(1);
  }
  const prompt = args.join(' ');

  console.log(`执行任务: ${prompt}`);
  const response = runOpencode(prompt);
  console.log('\n--- 完整输出 ---');
  console.log(response);

  const trimmedContent = cleanOutput(response);
  const fileName = generateFileName();

  writeFileSync(fileName, trimmedContent);
  console.log(`结果已写入 ${fileName}`);
}

main();