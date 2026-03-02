import pc from 'picocolors';

// ANSI 重置
export const RESET = '\x1b[0m';
export const BOLD = '\x1b[1m';

// 图标
export const S_STEP_ACTIVE = pc.green('◆');
export const S_STEP_SUBMIT = pc.green('◇');
export const S_STEP_CANCEL = pc.red('■');
export const S_RADIO_ACTIVE = pc.green('●');
export const S_RADIO_INACTIVE = pc.dim('○');
export const S_CHECKBOX_ACTIVE = pc.green('☑');
export const S_CHECKBOX_INACTIVE = pc.dim('☐');
export const S_CHECKBOX_LOCKED = pc.green('✓');
export const S_BULLET = pc.blue('●');
export const S_BAR = pc.dim('│');
export const S_BAR_H = pc.dim('─');
export const S_CORNER_TOP = pc.dim('┌');
export const S_CORNER_BOTTOM = pc.dim('└');
export const S_BRANCH = pc.dim('├');
export const S_BRANCH_END = pc.dim('└');

// Logo
export const LOGO_LINES = [
  ' █████╗  ██████╗ ███████╗███╗   ██╗████████╗███████╗',
  '██╔══██╗██╔════╝ ██╔════╝████╗  ██║╚══██╔══╝██╔════╝',
  '███████║██║  ███╗█████╗  ██╔██╗ ██║   ██║   █████╗  ',
  '██╔══██║██║   ██║██╔══╝  ██║╚██╗██║   ██║   ██╔══╝  ',
  '██║  ██║╚██████╔╝███████╗██║ ╚████║   ██║   ███████╗',
  '╚═╝  ╚═╝ ╚═════╝ ╚══════╝╚═╝  ╚═══╝   ╚═╝   ╚══════╝',
];

export const LOGO_COLORS = [
  pc.cyan,
  pc.cyan,
  pc.blue,
  pc.blue,
  pc.magenta,
  pc.magenta,
];

export function showLogo(): void {
  console.log();
  LOGO_LINES.forEach((line, i) => {
    console.log(LOGO_COLORS[i](line));
  });
  console.log();
}

export function showBanner(): void {
  showLogo();
  console.log(pc.dim('  AI Agent Management CLI'));
  console.log();
  console.log(`  ${pc.dim('$')} ${pc.cyan('npx opencode-agents add')} ${pc.dim('<repo>')}     ${pc.dim('Install agents from a repository')}`);
  console.log(`  ${pc.dim('$')} ${pc.cyan('npx opencode-agents list')}              ${pc.dim('List installed agents')}`);
  console.log(`  ${pc.dim('$')} ${pc.cyan('npx opencode-agents remove')}            ${pc.dim('Remove installed agents')}`);
  console.log(`  ${pc.dim('$')} ${pc.cyan('npx opencode-agents find')}              ${pc.dim('Search for agents')}`);
  console.log();
}

// 进度树状结构
export interface TreeStep {
  label: string;
  status: 'pending' | 'active' | 'done' | 'error';
  value?: string;
}

export function renderTree(steps: TreeStep[]): void {
  console.log();
  steps.forEach((step, index) => {
    const isLast = index === steps.length - 1;
    const prefix = isLast ? S_BRANCH_END : S_BRANCH;
    
    let icon: string;
    let color: (s: string) => string;
    
    switch (step.status) {
      case 'done':
        icon = pc.green('◆');
        color = pc.green;
        break;
      case 'active':
        icon = pc.cyan('◆');
        color = pc.cyan;
        break;
      case 'error':
        icon = pc.red('■');
        color = pc.red;
        break;
      default:
        icon = pc.dim('○');
        color = pc.dim;
    }
    
    console.log(`  ${prefix} ${icon} ${color(step.label)}`);
    
    if (step.value && step.status === 'done') {
      console.log(`  ${isLast ? '  ' : `${S_BAR} `}   ${pc.dim(step.value)}`);
    }
  });
  console.log();
}

// 技能卡片
export function renderSkillCard(name: string, description: string, index: number): void {
  console.log();
  console.log(`  ${S_BAR}`);
  console.log(`  ${S_BRANCH} ${pc.cyan('Agent:')} ${pc.bold(name)}`);
  console.log(`  ${S_BAR}`);
  console.log(`  ${S_BRANCH_END} ${pc.dim(description)}`);
  console.log();
}

// 分隔线
export function divider(): void {
  console.log(pc.dim('  ' + '─'.repeat(50)));
}

// 成功/错误信息
export function success(message: string): void {
  console.log(`  ${pc.green('✓')} ${message}`);
}

export function error(message: string): void {
  console.log(`  ${pc.red('✗')} ${message}`);
}

export function warning(message: string): void {
  console.log(`  ${pc.yellow('⚠')} ${message}`);
}

export function info(message: string): void {
  console.log(`  ${pc.blue('ℹ')} ${message}`);
}
