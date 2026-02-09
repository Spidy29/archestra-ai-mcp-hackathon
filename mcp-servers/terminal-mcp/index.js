import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { execSync, exec } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import { platform } from 'os';

// ==================== ENVIRONMENT CHECK FUNCTIONS ====================

function checkCommand(command) {
    try {
        if (platform() === 'win32') {
            execSync(`where ${command}`, { stdio: 'pipe' });
        } else {
            execSync(`which ${command}`, { stdio: 'pipe' });
        }
        return true;
    } catch {
        return false;
    }
}

function getVersion(command, versionFlag = '--version') {
    try {
        const output = execSync(`${command} ${versionFlag}`, {
            stdio: 'pipe',
            encoding: 'utf-8'
        });
        return output.trim().split('\n')[0];
    } catch {
        return null;
    }
}

function checkDevEnvironment() {
    const checks = {
        tools: {},
        files: {},
        summary: {
            passed: 0,
            failed: 0,
            warnings: 0
        }
    };

    // Check required tools
    const requiredTools = [
        { name: 'node', displayName: 'Node.js', required: true },
        { name: 'npm', displayName: 'NPM', required: true },
        { name: 'git', displayName: 'Git', required: true },
        { name: 'docker', displayName: 'Docker', required: false },
        { name: 'code', displayName: 'VS Code', required: false }
    ];

    requiredTools.forEach(tool => {
        const installed = checkCommand(tool.name);
        const version = installed ? getVersion(tool.name) : null;

        checks.tools[tool.displayName] = {
            installed,
            version,
            required: tool.required,
            status: installed ? '✅ OK' : (tool.required ? '❌ MISSING' : '⚠️ Optional')
        };

        if (installed) {
            checks.summary.passed++;
        } else if (tool.required) {
            checks.summary.failed++;
        } else {
            checks.summary.warnings++;
        }
    });

    // Check common project files
    const projectFiles = [
        { path: 'package.json', name: 'package.json', required: true },
        { path: '.env', name: '.env file', required: true },
        { path: '.env.example', name: '.env.example', required: false },
        { path: 'README.md', name: 'README', required: false },
        { path: '.gitignore', name: '.gitignore', required: false }
    ];

    projectFiles.forEach(file => {
        const exists = existsSync(file.path);
        checks.files[file.name] = {
            exists,
            required: file.required,
            status: exists ? '✅ Found' : (file.required ? '❌ MISSING' : '⚠️ Not found')
        };

        if (exists) {
            checks.summary.passed++;
        } else if (file.required) {
            checks.summary.failed++;
        }
    });

    checks.overallStatus = checks.summary.failed === 0
        ? '✅ Environment Ready'
        : `❌ ${checks.summary.failed} issue(s) need attention`;

    return checks;
}

function getSetupInstructions(issue) {
    const instructions = {
        'node': {
            title: 'Install Node.js',
            steps: [
                'Download Node.js LTS from https://nodejs.org/',
                'Run the installer and follow prompts',
                'Restart your terminal',
                'Verify with: node --version'
            ]
        },
        'npm': {
            title: 'Install NPM',
            steps: [
                'NPM comes with Node.js',
                'If missing, reinstall Node.js from https://nodejs.org/',
                'Verify with: npm --version'
            ]
        },
        'git': {
            title: 'Install Git',
            steps: [
                'Download Git from https://git-scm.com/downloads',
                'Run installer with default options',
                'Restart your terminal',
                'Verify with: git --version',
                'Configure: git config --global user.name "Your Name"',
                'Configure: git config --global user.email "your@email.com"'
            ]
        },
        'docker': {
            title: 'Install Docker Desktop',
            steps: [
                'Download Docker Desktop from https://docker.com/products/docker-desktop',
                'Run the installer',
                'Start Docker Desktop',
                'Verify with: docker --version'
            ]
        },
        '.env': {
            title: 'Create .env file',
            steps: [
                'Copy: cp .env.example .env (or copy .env.example .env on Windows)',
                'Open .env and fill in required values',
                'Never commit .env to git!'
            ]
        },
        'package.json': {
            title: 'Initialize project',
            steps: [
                'Run: npm init -y',
                'Or clone the correct repository'
            ]
        }
    };

    return instructions[issue] || {
        title: `Fix: ${issue}`,
        steps: ['Please check documentation for installation instructions']
    };
}

// Commands that are considered SAFE to run without approval
const SAFE_COMMANDS = [
    'node --version',
    'npm --version',
    'git --version',
    'docker --version',
    'npm list',
    'npm outdated',
    'git status',
    'git log --oneline -10',
    'pwd',
    'ls',
    'dir',
    'echo'
];

function isSafeCommand(command) {
    const cmdLower = command.toLowerCase().trim();
    return SAFE_COMMANDS.some(safe => cmdLower.startsWith(safe.toLowerCase()));
}

// ==================== MCP SERVER ====================

const server = new Server(
    {
        name: 'terminal-mcp',
        version: '1.0.0',
    },
    {
        capabilities: {
            tools: {},
        },
    }
);

server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
        tools: [
            {
                name: 'check_dev_environment',
                description: 'Check if the development environment is properly set up. Verifies tools (node, npm, git, docker) and project files.',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'get_setup_instructions',
                description: 'Get step-by-step instructions to fix a specific environment issue',
                inputSchema: {
                    type: 'object',
                    properties: {
                        issue: {
                            type: 'string',
                            description: 'The tool or file that needs to be set up (e.g., "node", "git", ".env")'
                        }
                    },
                    required: ['issue']
                }
            },
            {
                name: 'run_safe_command',
                description: 'Run a safe, read-only terminal command (version checks, git status, etc.)',
                inputSchema: {
                    type: 'object',
                    properties: {
                        command: {
                            type: 'string',
                            description: 'Safe command to run'
                        }
                    },
                    required: ['command']
                }
            },
            {
                name: 'run_setup_command',
                description: '⚠️ REQUIRES APPROVAL: Run a setup command that may modify the system (npm install, etc.). This tool requires explicit user approval through Archestra security guardrails.',
                inputSchema: {
                    type: 'object',
                    properties: {
                        command: {
                            type: 'string',
                            description: 'Setup command to run (requires approval)'
                        },
                        reason: {
                            type: 'string',
                            description: 'Explanation of why this command needs to run'
                        }
                    },
                    required: ['command', 'reason']
                }
            },
            {
                name: 'suggest_next_steps',
                description: 'Based on the current environment state, suggest what the developer should do next',
                inputSchema: {
                    type: 'object',
                    properties: {
                        currentTask: {
                            type: 'string',
                            description: 'What the developer is trying to do'
                        }
                    },
                    required: ['currentTask']
                }
            }
        ]
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        let result;

        switch (name) {
            case 'check_dev_environment':
                result = checkDevEnvironment();
                break;

            case 'get_setup_instructions':
                result = getSetupInstructions(args.issue);
                break;

            case 'run_safe_command':
                if (!isSafeCommand(args.command)) {
                    result = {
                        error: 'Command not in safe list. Use run_setup_command for commands that modify the system.',
                        safeCommands: SAFE_COMMANDS
                    };
                } else {
                    try {
                        const output = execSync(args.command, {
                            encoding: 'utf-8',
                            timeout: 10000
                        });
                        result = { output: output.trim(), success: true };
                    } catch (error) {
                        result = { error: error.message, success: false };
                    }
                }
                break;

            case 'run_setup_command':
                // In production, this would integrate with Archestra's approval system
                // For now, we return a request for approval
                result = {
                    status: 'APPROVAL_REQUIRED',
                    command: args.command,
                    reason: args.reason,
                    message: '⚠️ This command requires approval. In Archestra, this would trigger the security approval flow.',
                    securityNote: 'Archestra will show this command to the user for explicit approval before execution.'
                };
                break;

            case 'suggest_next_steps':
                const envCheck = checkDevEnvironment();
                const suggestions = [];

                if (envCheck.summary.failed > 0) {
                    suggestions.push({
                        priority: 'HIGH',
                        action: 'Fix environment issues first',
                        details: `${envCheck.summary.failed} required item(s) are missing`
                    });
                }

                if (args.currentTask.toLowerCase().includes('setup') ||
                    args.currentTask.toLowerCase().includes('install')) {
                    suggestions.push({
                        priority: 'MEDIUM',
                        action: 'Run npm install',
                        details: 'Install project dependencies'
                    });
                    suggestions.push({
                        priority: 'MEDIUM',
                        action: 'Copy .env.example to .env',
                        details: 'Set up environment variables'
                    });
                }

                if (args.currentTask.toLowerCase().includes('run') ||
                    args.currentTask.toLowerCase().includes('start')) {
                    suggestions.push({
                        priority: 'HIGH',
                        action: 'Check environment first',
                        details: 'Make sure all dependencies are installed'
                    });
                    suggestions.push({
                        priority: 'MEDIUM',
                        action: 'Run npm run dev',
                        details: 'Start the development server'
                    });
                }

                result = {
                    currentTask: args.currentTask,
                    environmentStatus: envCheck.overallStatus,
                    suggestions: suggestions
                };
                break;

            default:
                return {
                    content: [{ type: 'text', text: `Unknown tool: ${name}` }],
                    isError: true
                };
        }

        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }]
        };
    } catch (error) {
        return {
            content: [{ type: 'text', text: `Error: ${error.message}` }],
            isError: true
        };
    }
});

async function main() {
    const transport = new StdioServerTransport();
    await server.connect(transport);
    console.error('Terminal MCP Server running on stdio');
}

main().catch(console.error);
