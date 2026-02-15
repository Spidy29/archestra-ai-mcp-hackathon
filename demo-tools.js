#!/usr/bin/env node

/**
 * OnboardingOS - Interactive Tool Demo
 * ======================================
 * Call any of the 23 MCP tools directly and see results!
 * 
 * Usage: node demo-tools.js
 */

import { spawn } from 'child_process';
import { createInterface } from 'readline';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const C = {
    reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m',
    cyan: '\x1b[36m', yellow: '\x1b[33m', magenta: '\x1b[35m',
    bold: '\x1b[1m', dim: '\x1b[2m',
};

// ==================== DIRECT TOOL IMPLEMENTATIONS ====================
// Instead of going through MCP protocol, we import the logic directly

// --- DOCS MCP TOOLS ---
const DOCS_STORE = [
    {
        id: 'getting-started', title: 'Getting Started Guide', category: 'onboarding',
        content: `# Getting Started\n\nWelcome to the team!\n\n## Prerequisites\n- Node.js v18+\n- Docker Desktop\n- Git\n- VSCode\n\n## Setup\n1. Clone repo: git clone https://github.com/yourorg/project.git\n2. Install: npm install\n3. Copy env: cp .env.example .env\n4. Start: npm run dev\n\n## First Week Checklist\n- [ ] Complete environment setup\n- [ ] Read architecture docs\n- [ ] Join #dev-team Slack\n- [ ] Schedule 1:1 with team lead\n- [ ] Pick up a good-first-issue`,
        keywords: ['setup', 'install', 'getting started', 'onboarding']
    },
    {
        id: 'architecture', title: 'System Architecture', category: 'architecture',
        content: `# System Architecture\n\n## Frontend: React 18 + TypeScript + Tailwind\n## Backend: Node.js + Express + PostgreSQL + Redis\n## Infra: AWS + Kubernetes + GitHub Actions\n\n## Key Dirs: /frontend, /backend, /shared, /infra\n\n## Contacts\n- Frontend: @alice\n- Backend: @bob\n- DevOps: @charlie`,
        keywords: ['architecture', 'system', 'frontend', 'backend']
    },
    {
        id: 'coding-standards', title: 'Coding Standards', category: 'standards',
        content: `# Coding Standards\n\n- camelCase for variables/functions\n- PascalCase for classes\n- UPPER_SNAKE for constants\n- kebab-case for files\n\n## Git: feature/ABC-123-description\n## PRs: 2 approvals, <400 lines, squash merge`,
        keywords: ['coding', 'standards', 'conventions', 'git']
    },
    {
        id: 'faq', title: 'FAQ', category: 'faq',
        content: `# FAQ\n\nQ: How to run tests? → npm test\nQ: Staging DB? → VPN + npm run db:connect:staging\nQ: Broken env? → npm run clean && npm install\nQ: API keys? → Ask in #dev-help\nQ: Deploy schedule? → Staging daily 2pm, Prod Tue/Thu`,
        keywords: ['faq', 'help', 'questions']
    }
];

// --- SLACK MCP DATA ---
const TEAM = [
    { name: 'Alice Chen', username: 'alice', role: 'Senior Frontend Engineer', expertise: ['React', 'TypeScript', 'CSS', 'UI/UX'], available: true },
    { name: 'Bob Kumar', username: 'bob', role: 'Backend Lead', expertise: ['Node.js', 'PostgreSQL', 'API', 'authentication'], available: true },
    { name: 'Charlie Park', username: 'charlie', role: 'DevOps Engineer', expertise: ['Docker', 'Kubernetes', 'AWS', 'CI/CD'], available: false },
    { name: 'Diana Singh', username: 'diana', role: 'Product Manager', expertise: ['product', 'requirements', 'roadmap'], available: true },
    { name: 'Erik Johnson', username: 'erik', role: 'QA Lead', expertise: ['testing', 'QA', 'automation', 'e2e'], available: true },
];

const DISCUSSIONS = [
    { channel: '#dev-help', author: 'alice', q: 'How to set up local env?', a: 'npm install then cp .env.example .env then npm run dev', helpful: 12 },
    { channel: '#dev-help', author: 'bob', q: 'DB connection timeout?', a: 'Make sure Docker is running. Try docker-compose up -d db', helpful: 8 },
    { channel: '#backend', author: 'bob', q: 'How does auth work?', a: 'JWT tokens, check /backend/src/auth. Tokens expire 24h.', helpful: 15 },
    { channel: '#frontend', author: 'alice', q: 'State management?', a: 'Redux Toolkit. Global in /store, local with useState.', helpful: 10 },
    { channel: '#devops', author: 'charlie', q: 'Deploy to staging?', a: 'Push to staging branch. GitHub Actions auto-deploys.', helpful: 6 },
];

const CHANNELS = [
    { name: '#dev-team', desc: 'Main developer channel', members: 25 },
    { name: '#dev-help', desc: 'Get help with dev questions', members: 30 },
    { name: '#frontend', desc: 'Frontend discussions', members: 10 },
    { name: '#backend', desc: 'Backend discussions', members: 12 },
    { name: '#devops', desc: 'DevOps and infrastructure', members: 8 },
    { name: '#new-joiners', desc: 'Welcome channel', members: 20 },
];

// --- PROGRESS TRACKER ---
const progressData = {
    phases: [
        {
            name: '🔧 Day 1: Environment Setup', tasks: [
                { id: 'env-1', title: 'Clone the repository', done: false },
                { id: 'env-2', title: 'Install dependencies', done: false },
                { id: 'env-3', title: 'Set up .env file', done: false },
                { id: 'env-4', title: 'Run project locally', done: false },
                { id: 'env-5', title: 'Install VSCode extensions', done: false },
            ]
        },
        {
            name: '📖 Day 2-3: Codebase Exploration', tasks: [
                { id: 'code-1', title: 'Read architecture docs', done: false },
                { id: 'code-2', title: 'Explore main directories', done: false },
                { id: 'code-3', title: 'Run existing tests', done: false },
                { id: 'code-4', title: 'Review recent PRs', done: false },
            ]
        },
        {
            name: '👥 Day 4-5: Team Integration', tasks: [
                { id: 'team-1', title: 'Join Slack channels', done: false },
                { id: 'team-2', title: 'Schedule 1:1 with lead', done: false },
                { id: 'team-3', title: 'Meet onboarding buddy', done: false },
                { id: 'team-4', title: 'Pick first task', done: false },
            ]
        },
        {
            name: '🚀 Week 2: First Contribution', tasks: [
                { id: 'contrib-1', title: 'Complete first PR', done: false },
                { id: 'contrib-2', title: 'Get code review', done: false },
                { id: 'contrib-3', title: 'Attend sprint planning', done: false },
                { id: 'contrib-4', title: 'Document issues found', done: false },
            ]
        },
    ],
    achievements: [],
};

// --- TERMINAL CHECK ---
import { execSync } from 'child_process';
import { existsSync } from 'fs';
import { platform } from 'os';

function checkCmd(cmd) {
    try {
        execSync(platform() === 'win32' ? `where ${cmd}` : `which ${cmd}`, { stdio: 'pipe' });
        return true;
    } catch { return false; }
}
function getVer(cmd) {
    try { return execSync(`${cmd} --version`, { stdio: 'pipe', encoding: 'utf-8' }).trim().split('\n')[0]; }
    catch { return null; }
}

// ==================== TOOL IMPLEMENTATIONS ====================

const TOOLS = {
    // --- DOCS ---
    'search_docs': (args) => {
        const q = args.toLowerCase();
        const results = DOCS_STORE.filter(d =>
            d.title.toLowerCase().includes(q) || d.content.toLowerCase().includes(q) || d.keywords.some(k => k.includes(q))
        ).map(d => ({ id: d.id, title: d.title, category: d.category, excerpt: d.content.substring(0, 150) + '...' }));
        return results.length > 0 ? results : { message: 'No docs found for: ' + args };
    },
    'get_document': (args) => {
        const doc = DOCS_STORE.find(d => d.id === args);
        return doc ? { title: doc.title, content: doc.content } : { error: 'Doc not found: ' + args };
    },
    'get_onboarding_checklist': () => {
        return progressData.phases.map(p => ({
            phase: p.name,
            tasks: p.tasks.map(t => `${t.done ? '✅' : '⬜'} ${t.title}`)
        }));
    },
    'list_all_docs': () => DOCS_STORE.map(d => ({ id: d.id, title: d.title, category: d.category })),

    // --- SLACK ---
    'find_expert': (topic) => {
        const t = topic.toLowerCase();
        const matches = TEAM.filter(m => m.expertise.some(e => e.toLowerCase().includes(t) || t.includes(e.toLowerCase())));
        if (matches.length === 0) return { found: false, suggestion: 'Try #dev-help channel' };
        return { experts: matches.map(m => ({ name: m.name, role: m.role, username: `@${m.username}`, available: m.available ? '🟢' : '🔴', expertise: m.expertise.join(', ') })) };
    },
    'search_discussions': (query) => {
        const q = query.toLowerCase();
        const matches = DISCUSSIONS.filter(d => d.q.toLowerCase().includes(q) || d.a.toLowerCase().includes(q));
        return { found: matches.length, discussions: matches.map(d => ({ channel: d.channel, Q: d.q, A: d.a, by: `@${d.author}`, helpful: `👍 ${d.helpful}` })) };
    },
    'list_channels': () => CHANNELS,
    'send_welcome_message': (name) => ({
        action: '⚠️ REQUIRES APPROVAL',
        channel: '#new-joiners',
        message: `👋 Welcome ${name}! Join #dev-team and #dev-help. Your buddy will reach out soon! 🎉`,
        note: 'In Archestra, this would trigger approval flow'
    }),
    'get_team_contacts': () => TEAM.map(m => ({ name: m.name, role: m.role, username: `@${m.username}`, status: m.available ? '🟢 Available' : '🔴 Away' })),

    // --- TERMINAL ---
    'check_dev_environment': () => {
        const tools = ['node', 'npm', 'git', 'docker', 'code'];
        const results = {};
        tools.forEach(t => {
            const installed = checkCmd(t);
            results[t] = { installed, version: installed ? getVer(t) : null, status: installed ? '✅' : '❌' };
        });
        return results;
    },
    'get_setup_instructions': (issue) => {
        const guides = {
            node: { steps: ['Download from https://nodejs.org/', 'Run installer', 'Verify: node --version'] },
            git: { steps: ['Download from https://git-scm.com/', 'Run installer', 'git config --global user.name "Name"'] },
            docker: { steps: ['Download Docker Desktop', 'Start Docker Desktop', 'Verify: docker --version'] },
            '.env': { steps: ['Run: cp .env.example .env', 'Fill in required values', 'Never commit .env!'] },
        };
        return guides[issue] || { steps: ['Check documentation for ' + issue] };
    },
    'run_safe_command': (cmd) => {
        const safe = ['node --version', 'npm --version', 'git --version', 'docker --version', 'git status', 'npm list'];
        if (!safe.some(s => cmd.toLowerCase().startsWith(s.toLowerCase()))) {
            return { error: '❌ Not a safe command! Safe commands: ' + safe.join(', ') };
        }
        try { return { output: execSync(cmd, { encoding: 'utf-8', timeout: 5000 }).trim(), success: true }; }
        catch (e) { return { error: e.message, success: false }; }
    },
    'run_setup_command': (cmd) => ({
        status: '⚠️ APPROVAL REQUIRED',
        command: cmd,
        message: 'In Archestra, this triggers security approval flow before execution'
    }),
    'suggest_next_steps': (task) => {
        const suggestions = [
            { priority: 'HIGH', action: 'Check environment first', details: 'Make sure tools are installed' },
            { priority: 'MEDIUM', action: 'Run npm install', details: 'Install dependencies' },
            { priority: 'MEDIUM', action: 'Copy .env.example to .env', details: 'Set up config' },
        ];
        return { currentTask: task, suggestions };
    },

    // --- GITHUB (simulated) ---
    'explain_repo_structure': (repo) => ({
        name: repo || 'sample-project',
        languages: ['JavaScript', 'TypeScript', 'CSS'],
        structure: `📁 ${repo || 'project'}/\n├── 📁 frontend/\n├── 📁 backend/\n├── 📁 shared/\n├── 📁 infra/\n├── 📄 package.json\n├── 📄 README.md\n├── 📄 .gitignore`,
        note: '💡 With GITHUB_TOKEN, this would analyze any real GitHub repo!'
    }),
    'find_file': (filename) => ({
        searching: filename,
        note: '💡 With GITHUB_TOKEN, this searches across any GitHub repository!',
        example: [{ path: `src/${filename}`, url: `https://github.com/org/repo/blob/main/src/${filename}` }]
    }),
    'explain_code': (path) => ({
        path: path,
        note: '💡 With GITHUB_TOKEN, this fetches and explains any file from GitHub!',
        example: { lines: 150, extension: path?.split('.').pop() || 'js', preview: '// File contents would appear here...' }
    }),
    'get_recent_prs': () => ({
        note: '💡 With GITHUB_TOKEN, this shows real PRs!',
        example: [
            { number: 42, title: 'feat: Add user dashboard', author: 'alice', state: 'merged' },
            { number: 41, title: 'fix: Login redirect bug', author: 'bob', state: 'closed' },
            { number: 40, title: 'chore: Update dependencies', author: 'charlie', state: 'open' },
        ]
    }),
    'who_owns_code': (path) => ({
        path: path,
        note: '💡 With GITHUB_TOKEN, this finds real code owners!',
        example: [{ author: 'alice', commits: 23 }, { author: 'bob', commits: 15 }]
    }),

    // --- PROGRESS ---
    'get_progress_dashboard': (name) => {
        const total = progressData.phases.reduce((s, p) => s + p.tasks.length, 0);
        const done = progressData.phases.reduce((s, p) => s + p.tasks.filter(t => t.done).length, 0);
        const pct = Math.round((done / total) * 100);
        const bar = '█'.repeat(Math.floor(pct / 5)) + '░'.repeat(20 - Math.floor(pct / 5));
        return {
            developer: name || 'New Dev',
            progress: `[${bar}] ${pct}%`,
            completed: `${done}/${total} tasks`,
            phases: progressData.phases.map(p => ({
                name: p.name,
                tasks: p.tasks.map(t => `${t.done ? '✅' : '⬜'} [${t.id}] ${t.title}`)
            })),
            achievements: progressData.achievements.length > 0 ? progressData.achievements : ['None yet — complete tasks to unlock!']
        };
    },
    'complete_task': (taskId) => {
        for (const phase of progressData.phases) {
            const task = phase.tasks.find(t => t.id === taskId);
            if (task) {
                task.done = true;
                const total = progressData.phases.reduce((s, p) => s + p.tasks.length, 0);
                const done = progressData.phases.reduce((s, p) => s + p.tasks.filter(t => t.done).length, 0);
                const pct = Math.round((done / total) * 100);
                if (pct >= 25 && !progressData.achievements.includes('🌱 Quick Starter')) progressData.achievements.push('🌱 Quick Starter');
                if (pct >= 50 && !progressData.achievements.includes('⚡ Halfway Hero')) progressData.achievements.push('⚡ Halfway Hero');
                return { success: true, message: `✅ Completed: "${task.title}"`, progress: `${done}/${total} (${pct}%)`, achievements: progressData.achievements };
            }
        }
        return { error: 'Task not found: ' + taskId };
    },
    'get_next_tasks': (name) => {
        const next = [];
        for (const phase of progressData.phases) {
            for (const t of phase.tasks) {
                if (!t.done) { next.push({ id: t.id, title: t.title, phase: phase.name }); if (next.length >= 3) break; }
            }
            if (next.length >= 3) break;
        }
        return { developer: name || 'Dev', nextTasks: next };
    },
    'get_leaderboard': () => ({
        leaderboard: [{ developer: 'You', progress: `${progressData.phases.reduce((s, p) => s + p.tasks.filter(t => t.done).length, 0)}/17 tasks` }],
        note: 'In production, this shows all new hires!'
    }),
};

// ==================== INTERACTIVE MENU ====================

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise(r => rl.question(q, r));

function printMenu() {
    console.log('');
    console.log(`${C.bold}${C.cyan}╔══════════════════════════════════════════════════════════════╗${C.reset}`);
    console.log(`${C.bold}${C.cyan}║           🚀 OnboardingOS — Interactive Tool Demo           ║${C.reset}`);
    console.log(`${C.bold}${C.cyan}╚══════════════════════════════════════════════════════════════╝${C.reset}`);
    console.log('');
    console.log(`${C.bold}  📖 DOCS MCP:${C.reset}`);
    console.log(`${C.dim}   1.${C.reset} search_docs ${C.dim}(query)${C.reset}              2. get_document ${C.dim}(id)${C.reset}`);
    console.log(`${C.dim}   3.${C.reset} get_onboarding_checklist          4. list_all_docs`);
    console.log('');
    console.log(`${C.bold}  💬 SLACK MCP:${C.reset}`);
    console.log(`${C.dim}   5.${C.reset} find_expert ${C.dim}(topic)${C.reset}              6. search_discussions ${C.dim}(query)${C.reset}`);
    console.log(`${C.dim}   7.${C.reset} list_channels                     8. send_welcome_message ${C.dim}(name)${C.reset}`);
    console.log(`${C.dim}   9.${C.reset} get_team_contacts`);
    console.log('');
    console.log(`${C.bold}  🖥️  TERMINAL MCP:${C.reset}`);
    console.log(`${C.dim}  10.${C.reset} check_dev_environment            11. get_setup_instructions ${C.dim}(tool)${C.reset}`);
    console.log(`${C.dim}  12.${C.reset} run_safe_command ${C.dim}(cmd)${C.reset}           13. run_setup_command ${C.dim}(cmd)${C.reset}`);
    console.log(`${C.dim}  14.${C.reset} suggest_next_steps ${C.dim}(task)${C.reset}`);
    console.log('');
    console.log(`${C.bold}  📂 GITHUB MCP:${C.reset}`);
    console.log(`${C.dim}  15.${C.reset} explain_repo_structure ${C.dim}(repo)${C.reset}    16. find_file ${C.dim}(filename)${C.reset}`);
    console.log(`${C.dim}  17.${C.reset} explain_code ${C.dim}(path)${C.reset}              18. get_recent_prs`);
    console.log(`${C.dim}  19.${C.reset} who_owns_code ${C.dim}(path)${C.reset}`);
    console.log('');
    console.log(`${C.bold}  📊 PROGRESS MCP:${C.reset}`);
    console.log(`${C.dim}  20.${C.reset} get_progress_dashboard ${C.dim}(name)${C.reset}    21. complete_task ${C.dim}(taskId)${C.reset}`);
    console.log(`${C.dim}  22.${C.reset} get_next_tasks ${C.dim}(name)${C.reset}            23. get_leaderboard`);
    console.log('');
    console.log(`${C.dim}   0.${C.reset} Exit`);
    console.log('');
}

const TOOL_MAP = {
    '1': { fn: 'search_docs', needsArg: true, argPrompt: 'Search query: ', argExample: 'setup' },
    '2': { fn: 'get_document', needsArg: true, argPrompt: 'Doc ID (getting-started/architecture/coding-standards/faq): ', argExample: 'architecture' },
    '3': { fn: 'get_onboarding_checklist', needsArg: false },
    '4': { fn: 'list_all_docs', needsArg: false },
    '5': { fn: 'find_expert', needsArg: true, argPrompt: 'Topic (e.g. React, database, Docker): ', argExample: 'React' },
    '6': { fn: 'search_discussions', needsArg: true, argPrompt: 'Search query: ', argExample: 'authentication' },
    '7': { fn: 'list_channels', needsArg: false },
    '8': { fn: 'send_welcome_message', needsArg: true, argPrompt: 'New member name: ', argExample: 'Rahul' },
    '9': { fn: 'get_team_contacts', needsArg: false },
    '10': { fn: 'check_dev_environment', needsArg: false },
    '11': { fn: 'get_setup_instructions', needsArg: true, argPrompt: 'Tool to fix (node/git/docker/.env): ', argExample: 'node' },
    '12': { fn: 'run_safe_command', needsArg: true, argPrompt: 'Safe command: ', argExample: 'node --version' },
    '13': { fn: 'run_setup_command', needsArg: true, argPrompt: 'Setup command: ', argExample: 'npm install' },
    '14': { fn: 'suggest_next_steps', needsArg: true, argPrompt: 'What are you trying to do? ', argExample: 'setup my environment' },
    '15': { fn: 'explain_repo_structure', needsArg: true, argPrompt: 'Repo name: ', argExample: 'my-project' },
    '16': { fn: 'find_file', needsArg: true, argPrompt: 'Filename to search: ', argExample: 'auth.js' },
    '17': { fn: 'explain_code', needsArg: true, argPrompt: 'File path: ', argExample: 'src/auth/login.js' },
    '18': { fn: 'get_recent_prs', needsArg: false },
    '19': { fn: 'who_owns_code', needsArg: true, argPrompt: 'Code path: ', argExample: 'src/auth' },
    '20': { fn: 'get_progress_dashboard', needsArg: true, argPrompt: 'Your name: ', argExample: 'Rahul' },
    '21': { fn: 'complete_task', needsArg: true, argPrompt: 'Task ID (e.g. env-1, code-2): ', argExample: 'env-1' },
    '22': { fn: 'get_next_tasks', needsArg: true, argPrompt: 'Your name: ', argExample: 'Rahul' },
    '23': { fn: 'get_leaderboard', needsArg: false },
};

async function main() {
    printMenu();

    while (true) {
        const choice = await ask(`${C.cyan}  Enter tool number (0-23): ${C.reset}`);

        if (choice === '0' || choice.toLowerCase() === 'exit' || choice.toLowerCase() === 'q') {
            console.log(`\n${C.green}  👋 Bye! Happy onboarding!${C.reset}\n`);
            break;
        }

        const tool = TOOL_MAP[choice];
        if (!tool) {
            console.log(`${C.red}  ❌ Invalid choice. Pick 0-23.${C.reset}`);
            continue;
        }

        let arg = null;
        if (tool.needsArg) {
            arg = await ask(`${C.yellow}  ${tool.argPrompt}${C.reset}`);
            if (!arg.trim()) arg = tool.argExample;
        }

        console.log(`\n${C.bold}${C.magenta}  ▶ ${tool.fn}(${arg ? '"' + arg + '"' : ''})${C.reset}`);
        console.log(`${C.dim}  ${'─'.repeat(55)}${C.reset}`);

        try {
            const result = TOOLS[tool.fn](arg);
            console.log(JSON.stringify(result, null, 2).split('\n').map(l => `  ${C.green}${l}${C.reset}`).join('\n'));
        } catch (e) {
            console.log(`${C.red}  Error: ${e.message}${C.reset}`);
        }

        console.log(`${C.dim}  ${'─'.repeat(55)}${C.reset}\n`);
    }

    rl.close();
}

main().catch(console.error);
