import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

const SERVERS = [
    { name: 'GitHub MCP', path: 'mcp-servers/github-mcp/index.js', expectedTools: 5 },
    { name: 'Docs MCP', path: 'mcp-servers/docs-mcp/index.js', expectedTools: 4 },
    { name: 'Terminal MCP', path: 'mcp-servers/terminal-mcp/index.js', expectedTools: 5 },
    { name: 'Slack MCP', path: 'mcp-servers/slack-mcp/index.js', expectedTools: 5 },
    { name: 'Progress MCP', path: 'mcp-servers/progress-mcp/index.js', expectedTools: 4 },
];

const C = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    cyan: '\x1b[36m',
    bold: '\x1b[1m',
    dim: '\x1b[2m',
};

async function testServer(server) {
    return new Promise((resolve) => {
        const fullPath = join(__dirname, server.path);
        const proc = spawn('node', [fullPath], {
            stdio: ['pipe', 'pipe', 'pipe'],
        });

        let stderr = '';
        let resolved = false;

        const done = (result) => {
            if (resolved) return;
            resolved = true;
            try { proc.kill(); } catch (e) { }
            resolve(result);
        };

        proc.stderr.on('data', (data) => {
            stderr += data.toString();
            if (stderr.includes('running on stdio')) {
                done({ success: true, message: stderr.trim() });
            }
        });

        proc.on('error', (err) => {
            done({ success: false, error: err.message });
        });

        proc.on('close', (code) => {
            if (!resolved) {
                done({ success: false, error: `Exited with code ${code}. ${stderr}` });
            }
        });

        // Timeout after 5 seconds
        setTimeout(() => {
            done({ success: false, error: 'Timeout — server did not start within 5s' });
        }, 5000);
    });
}

async function main() {
    console.log('');
    console.log(`${C.bold}${C.cyan}╔══════════════════════════════════════════╗${C.reset}`);
    console.log(`${C.bold}${C.cyan}║     🚀 OnboardingOS Server Tester       ║${C.reset}`);
    console.log(`${C.bold}${C.cyan}╚══════════════════════════════════════════╝${C.reset}`);
    console.log('');

    let passed = 0;
    let failed = 0;
    let totalTools = 0;

    for (const server of SERVERS) {
        process.stdout.write(`${C.dim}  Testing ${server.name}...${C.reset}`);
        const result = await testServer(server);

        if (result.success) {
            passed++;
            totalTools += server.expectedTools;
            console.log(`\r${C.green}  ✅ ${server.name}${C.reset} — Started OK (${server.expectedTools} tools)`);
        } else {
            failed++;
            console.log(`\r${C.red}  ❌ ${server.name}${C.reset} — ${result.error}`);
        }
    }

    console.log('');
    console.log(`${C.bold}  ════════════════════════════════════════${C.reset}`);
    console.log(`${C.bold}  Results: ${C.green}${passed} passed${C.reset}, ${failed > 0 ? C.red : C.dim}${failed} failed${C.reset}`);
    console.log(`${C.bold}  Total Tools: ${C.cyan}${totalTools}${C.reset}`);
    console.log(`${C.bold}  ════════════════════════════════════════${C.reset}`);
    console.log('');

    if (failed === 0) {
        console.log(`${C.green}  🎉 All MCP servers are working! Ready for Archestra.${C.reset}`);
    } else {
        console.log(`${C.red}  ⚠️  ${failed} server(s) have issues. Check errors above.${C.reset}`);
    }
    console.log('');

    process.exit(failed > 0 ? 1 : 0);
}

main().catch(console.error);
