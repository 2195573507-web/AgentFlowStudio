import type { SafetyCheckResult, RiskLevel } from '../../shared/types';

// ── Rule definition ──

interface SafetyRule {
  /** Regex pattern to match against the command. */
  pattern: RegExp;
  /** Risk level if this rule matches. */
  riskLevel: RiskLevel;
  /** Short name for reporting. */
  ruleName: string;
  /** Human-readable explanation of the danger. */
  explanation: string;
  /** A safer alternative if one exists. */
  saferAlternative: string;
  /** Whether to suggest creating a backup before running. */
  suggestBackup: boolean;
  /** Whether to suggest running in an isolated environment. */
  suggestIsolation: boolean;
}

// ── Rule set ──

const RULES: SafetyRule[] = [
  // ═══ CRITICAL ═══

  // ── rm -rf on root / system paths ──
  {
    pattern: /\brm\s+.*(-r|-rf|--recursive).*(\/|\/home|C:\\|D:\\)/i,
    riskLevel: 'Critical',
    ruleName: 'rm 递归删除系统路径',
    explanation: '该命令会递归删除系统根目录或用户主目录下的所有文件，可能导致系统崩溃或数据永久丢失。',
    saferAlternative: '指定明确的子目录路径，避免在系统根目录执行删除操作。使用 trash-cli 或回收站代替直接删除。',
    suggestBackup: true,
    suggestIsolation: false,
  },

  // ── Remove-Item -Recurse on system paths ──
  {
    pattern: /Remove-Item\s+.*-Recurse.*(C:\\|D:\\|\\|%USERPROFILE%|\\home|~)/i,
    riskLevel: 'Critical',
    ruleName: 'PowerShell Remove-Item 递归删除系统路径',
    explanation: '该命令会递归删除系统盘或用户目录，导致系统无法启动或数据永久丢失。',
    saferAlternative: '指定明确的子目录，避免对系统根目录使用 -Recurse。先运行 Get-ChildItem 查看将要删除的文件列表。',
    suggestBackup: true,
    suggestIsolation: false,
  },

  // ── del /s /q on system paths ──
  {
    pattern: /\bdel\s+.*\/[sq].*(C:\\|D:\\|%SystemRoot%|%USERPROFILE%)/i,
    riskLevel: 'Critical',
    ruleName: 'CMD del 递归删除系统路径',
    explanation: '该命令会静默递归删除系统关键目录的所有文件，极可能导致操作系统损坏。',
    saferAlternative: '删除前使用 dir 命令查看文件列表，只针对特定项目目录执行删除操作。',
    suggestBackup: true,
    suggestIsolation: false,
  },

  // ── format command ──
  {
    pattern: /\bformat\s+[a-zA-Z]:/i,
    riskLevel: 'Critical',
    ruleName: '格式化磁盘',
    explanation: '格式化命令会清除整个磁盘分区的所有数据，且通常不可恢复。',
    saferAlternative: '如果确实需要格式化，先在另一台设备上备份所有重要数据。考虑使用磁盘清理工具而非格式化。',
    suggestBackup: true,
    suggestIsolation: true,
  },

  // ── diskpart ──
  {
    pattern: /\bdiskpart\b/i,
    riskLevel: 'Critical',
    ruleName: '磁盘分区管理 (diskpart)',
    explanation: 'diskpart 是 Windows 磁盘分区管理工具，可以删除分区、格式化磁盘，误操作可能导致全盘数据丢失。',
    saferAlternative: '使用 Windows 磁盘管理图形界面代替命令行操作，避免误操作。',
    suggestBackup: true,
    suggestIsolation: true,
  },

  // ── iwr ... | iex (Invoke-WebRequest → Invoke-Expression) ──
  {
    pattern: /\biwr\s+.*\|\s*iex\b/i,
    riskLevel: 'Critical',
    ruleName: '远程代码执行 (iwr | iex)',
    explanation: '从网络下载并直接执行代码极其危险。攻击者可以替换远程脚本，在你不知情的情况下执行恶意代码。',
    saferAlternative: '下载脚本后先用文本编辑器查看内容，确认安全后再手动执行。检查脚本的数字签名。',
    suggestBackup: false,
    suggestIsolation: true,
  },

  // ── irm ... | iex ──
  {
    pattern: /\birm\s+.*\|\s*iex\b/i,
    riskLevel: 'Critical',
    ruleName: '远程代码执行 (irm | iex)',
    explanation: 'Invoke-RestMethod 下载并直接通过 Invoke-Expression 执行是顶级安全风险，等同于运行未知代码。',
    saferAlternative: '将 irm 结果先保存到变量或文件，检查内容后再决定是否执行。',
    suggestBackup: false,
    suggestIsolation: true,
  },

  // ── curl ... | bash ──
  {
    pattern: /\bcurl\s+.*\|\s*bash\b/i,
    riskLevel: 'Critical',
    ruleName: '远程代码执行 (curl | bash)',
    explanation: '从网络下载脚本并直接通过 bash 执行是一个常见但极其危险的操作。中间人攻击或服务器被入侵都可能注入恶意代码。',
    saferAlternative: '先用 curl 下载脚本到文件，检查内容后手动执行。使用 wget 下载并审查。',
    suggestBackup: false,
    suggestIsolation: true,
  },

  // ═══ HIGH ═══

  // ── Invoke-WebRequest followed by execution ──
  {
    pattern: /\bInvoke-WebRequest\s+.*-OutFile\s+.*\.(exe|ps1|bat|cmd|vbs)/i,
    riskLevel: 'High',
    ruleName: '下载可执行文件',
    explanation: '从网络下载可执行文件或脚本存在风险，尤其是来源不可信时。下载的文件可能包含恶意软件。',
    saferAlternative: '仅从官方或可信任的源下载文件。下载后使用 VirusTotal 或 Windows Defender 扫描文件。',
    suggestBackup: false,
    suggestIsolation: true,
  },

  // ── Reading API keys from env/files ──
  {
    pattern: /(?:cat|type|Get-Content|echo|printenv)\s+.*(?:\.env|\.secret|api.?key|token|password)/i,
    riskLevel: 'High',
    ruleName: '读取敏感凭证文件',
    explanation: '此命令读取包含 API 密钥或密码的敏感文件。将密钥暴露在终端输出中可能被日志记录或被屏幕共享泄露。',
    saferAlternative: '使用专门的密钥管理工具（如 1Password CLI、Azure Key Vault）或在代码中使用环境变量（process.env）读取。',
    suggestBackup: false,
    suggestIsolation: false,
  },

  // ── Modifying hosts file ──
  {
    pattern: /(?:echo|tee|write|Set-Content|Out-File)\s+.*(?:>>\s*)?\/etc\/hosts|C:\\Windows\\System32\\drivers\\etc\\hosts/i,
    riskLevel: 'High',
    ruleName: '修改 hosts 文件',
    explanation: '修改系统 hosts 文件可以劫持域名解析，重定向流量。恶意修改可能导致无法访问正常网站或泄露敏感信息。',
    saferAlternative: '使用本地 DNS 工具（如 dnsmasq）或浏览器扩展（如 SwitchHosts）管理 hosts 规则。',
    suggestBackup: true,
    suggestIsolation: false,
  },

  // ── Modifying registry ──
  {
    pattern: /\b(?:reg\s+(?:add|delete|import)|Set-ItemProperty\s+.*HKLM:|New-Item\s+.*Registry::)/i,
    riskLevel: 'High',
    ruleName: '修改 Windows 注册表',
    explanation: '修改注册表可能影响系统稳定性、安全设置或导致应用无法正常运行。不正确的修改可能需要重装系统。',
    saferAlternative: '使用 Windows 设置界面或组策略编辑器代替直接修改注册表。修改前务必导出注册表备份。',
    suggestBackup: true,
    suggestIsolation: false,
  },

  // ── Disabling firewall ──
  {
    pattern: /\b(?:netsh\s+.*firewall|Set-NetFirewallProfile\s+.*-Enabled\s+False|ufw\s+disable|systemctl\s+stop\s+firewalld)/i,
    riskLevel: 'High',
    ruleName: '禁用防火墙',
    explanation: '关闭防火墙会使系统暴露在网络攻击之下。即使只是临时关闭，也给了攻击者可趁之机。',
    saferAlternative: '仅开放需要的特定端口，而不是完全关闭防火墙。例如：netsh advfirewall firewall add rule ...',
    suggestBackup: false,
    suggestIsolation: false,
  },

  // ── Executing unknown .exe ──
  {
    pattern: /(?:\.\/|start\s+|Start-Process\s+)([a-zA-Z0-9_-]+\.(?:exe|msi|bat|cmd|ps1|vbs|dll|scr))\b/i,
    riskLevel: 'High',
    ruleName: '执行未知可执行文件',
    explanation: '执行未知来源的可执行文件或脚本可能触发恶意软件、勒索软件或后门程序。',
    saferAlternative: '先在沙箱环境（Windows Sandbox、VM）中测试。检查文件的数字签名和 VirusTotal 结果。',
    suggestBackup: false,
    suggestIsolation: true,
  },

  // ═══ MEDIUM ═══

  // ── Printing environment variables ──
  {
    pattern: /\b(?:echo\s+\$|printenv|Get-ChildItem\s+Env:|set\s*$|export\s*$)/i,
    riskLevel: 'Medium',
    ruleName: '输出环境变量',
    explanation: '打印环境变量可能意外暴露 API 密钥、数据库密码等敏感信息。终端输出可能被日志记录。',
    saferAlternative: '仅打印特定的已知安全的变量（如 PATH）。对于敏感变量，确认终端不会记录历史后再操作。',
    suggestBackup: false,
    suggestIsolation: false,
  },

  // ── Uploading files via curl -F ──
  {
    pattern: /\bcurl\s+.*-F\s/i,
    riskLevel: 'Medium',
    ruleName: '上传文件到远程服务器',
    explanation: '通过 curl 上传文件会将本地数据发送到远程服务器。确认目标 URL 可信，且不包含敏感信息的文件。',
    saferAlternative: '使用加密传输（HTTPS），确认接收服务器可信。避免上传包含个人数据或敏感信息的文件。',
    suggestBackup: false,
    suggestIsolation: false,
  },

  // ═══ LOW ═══

  // ── npm postinstall scripts ──
  {
    pattern: /\bnpm\s+(?:install|i)\s+.*--ignore-scripts/i,
    riskLevel: 'Low',
    ruleName: 'npm 忽略安装脚本',
    explanation: '使用 --ignore-scripts 跳过 postinstall 脚本可以防止恶意代码执行，但也可能跳过必要的构建步骤。',
    saferAlternative: '审查 package.json 中的 scripts 字段，确认 postinstall 脚本内容安全。对于可信包正常安装。',
    suggestBackup: false,
    suggestIsolation: false,
  },

  // Warning for any npm install from unknown source
  {
    pattern: /\bnpm\s+(?:install|i)\s+-g\s/i,
    riskLevel: 'Low',
    ruleName: '全局安装 npm 包',
    explanation: '全局安装 npm 包会将可执行文件添加到系统 PATH，可能与其他工具冲突或引入安全风险。',
    saferAlternative: '优先使用 npx 运行一次性命令，或使用项目本地依赖而非全局安装。',
    suggestBackup: false,
    suggestIsolation: false,
  },
];

// ── Public API ──

/**
 * Check a command string against all safety rules.
 * Returns a summary of the highest risk, all matched rules, and suggestions.
 */
export function checkCommandSafety(command: string): SafetyCheckResult {
  if (!command || command.trim().length === 0) {
    return {
      riskLevel: 'Safe',
      matchedRules: [],
      explanation: '无命令需要检查。',
      saferAlternative: '',
      suggestBackup: false,
      suggestIsolation: false,
    };
  }

  const matched: SafetyRule[] = [];

  for (const rule of RULES) {
    if (rule.pattern.test(command)) {
      matched.push(rule);
    }
  }

  if (matched.length === 0) {
    return {
      riskLevel: 'Safe',
      matchedRules: [],
      explanation: '未检测到已知的安全风险。命令看起来是安全的。',
      saferAlternative: '',
      suggestBackup: false,
      suggestIsolation: false,
    };
  }

  // Determine highest risk level
  const riskOrder: RiskLevel[] = ['Safe', 'Low', 'Medium', 'High', 'Critical'];
  const highestRisk = matched.reduce((highest, rule) => {
    const currentIdx = riskOrder.indexOf(rule.riskLevel);
    const highestIdx = riskOrder.indexOf(highest);
    return currentIdx > highestIdx ? rule.riskLevel : highest;
  }, 'Safe' as RiskLevel);

  // Build combined explanation
  const ruleNames = matched.map((r) => r.ruleName);
  const explanations = matched.map((r) => r.explanation);

  const explanation =
    `检测到 ${matched.length} 个安全问题:\n\n` +
    matched
      .map(
        (r, i) =>
          `${i + 1}. **[${r.riskLevel}] ${r.ruleName}**\n   ${r.explanation}`,
      )
      .join('\n\n');

  const saferAlternative = matched
    .filter((r) => r.saferAlternative)
    .map((r, i) => `${i + 1}. ${r.saferAlternative}`)
    .join('\n');

  const suggestBackup = matched.some((r) => r.suggestBackup);
  const suggestIsolation = matched.some((r) => r.suggestIsolation);

  return {
    riskLevel: highestRisk,
    matchedRules: ruleNames,
    explanation,
    saferAlternative,
    suggestBackup,
    suggestIsolation,
  };
}

/**
 * Quick check: returns only the maximum risk level without detailed analysis.
 * Useful for fast pre-checks before running commands.
 */
export function quickRiskCheck(command: string): RiskLevel {
  if (!command || command.trim().length === 0) return 'Safe';

  const riskOrder: RiskLevel[] = ['Safe', 'Low', 'Medium', 'High', 'Critical'];
  let maxIdx = 0;

  for (const rule of RULES) {
    if (rule.pattern.test(command)) {
      const idx = riskOrder.indexOf(rule.riskLevel);
      if (idx > maxIdx) {
        maxIdx = idx;
        if (maxIdx === riskOrder.length - 1) break; // Critical - no need to continue
      }
    }
  }

  return riskOrder[maxIdx];
}

/**
 * Return all registered safety rules (useful for UI display / audit).
 */
export function getAllSafetyRules(): Omit<SafetyRule, 'pattern'>[] {
  return RULES.map(({ pattern: _pattern, ...rest }) => ({
    ...rest,
    pattern: undefined as unknown as RegExp,
  })).map(({ pattern: _p, ...rest }) => rest);
}
