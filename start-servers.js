import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SERVERS = [
    { name: 'GitHub MCP', path: 'mcp-servers/github-mcp/index.js', port: 4001 },
    { name: 'Docs MCP', path: 'mcp-servers/docs-mcp/index.js', port: 4002 },
    { name: 'Terminal MCP', path: 'mcp-servers/terminal-mcp/index.js', port: 4003 },
    { name: 'Slack MCP', path: 'mcp-servers/slack-mcp/index.js', port: 4004 },
    { name: 'Progress MCP', path: 'mcp-servers/progress-mcp/index.js', port: 4005 },
];

const C = {
    reset: '\x1b[0m', green: '\x1b[32m', red: '\x1b[31m',
    cyan: '\x1b[36m', yellow: '\x1b[33m', bold: '\x1b[1m', dim: '\x1b[2m',
};

console.log('');
console.log(`${C.bold}${C.cyan}╔══════════════════════════════════════════════════════╗${C.reset}`);
console.log(`${C.bold}${C.cyan}║   🚀 OnboardingOS — Starting MCP Servers (HTTP)     ║${C.reset}`);
console.log(`${C.bold}${C.cyan}╚══════════════════════════════════════════════════════╝${C.reset}`);
console.log('');

const processes = [];

for (const server of SERVERS) {
    const fullPath = join(__dirname, server.path);
    const proc = spawn('node', [fullPath], {
        env: { ...process.env, PORT: String(server.port) },
        stdio: ['pipe', 'pipe', 'pipe'],
    });

    proc.stderr.on('data', (data) => {
        const msg = data.toString().trim();
        if (msg.includes('running on')) {
            console.log(`${C.green}  ✅ ${server.name}${C.reset} → ${C.cyan}http://localhost:${server.port}/sse${C.reset}`);
        }
    });

    proc.on('error', (err) => {
        console.log(`${C.red}  ❌ ${server.name} — ${err.message}${C.reset}`);
    });

    proc.on('close', (code) => {
        if (code !== null && code !== 0) {
            console.log(`${C.red}  ❌ ${server.name} exited with code ${code}${C.reset}`);
        }
    });

    processes.push(proc);
}
setTimeout(() => {
    console.log('');
    console.log(`${C.bold}  ════════════════════════════════════════════════${C.reset}`);
    console.log(`${C.bold}  Register in Archestra using these URLs:${C.reset}`);
    console.log('');
    for (const s of SERVERS) {
        console.log(`${C.yellow}    ${s.name.padEnd(15)}${C.reset}→ ${C.cyan}http://host.docker.internal:${s.port}/sse${C.reset}`);
    }
    console.log('');
    console.log(`${C.dim}  (Use host.docker.internal because Archestra runs in Docker)${C.reset}`);
    console.log(`${C.bold}  ════════════════════════════════════════════════${C.reset}`);
    console.log('');
    console.log(`${C.green}  Press Ctrl+C to stop all servers${C.reset}`);
}, 2000);

process.on('SIGINT', () => {
    console.log(`\n${C.yellow}  Stopping all servers...${C.reset}`);
    processes.forEach(p => p.kill());
    process.exit(0);
});
process.stdin.resume();
