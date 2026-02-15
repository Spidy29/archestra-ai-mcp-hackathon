import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Simple in-memory document store (would use vector DB in production)
const DOCS_STORE = {
    documents: [
        {
            id: 'getting-started',
            title: 'Getting Started Guide',
            category: 'onboarding',
            content: `
# Getting Started with Our Project

Welcome to the team! This guide will help you get set up quickly.

## Prerequisites
- Node.js v18+
- Docker Desktop
- Git
- VSCode (recommended)

## Setup Steps

1. Clone the repository:
   \`\`\`bash
   git clone https://github.com/yourorg/project.git
   cd project
   \`\`\`

2. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

3. Copy environment file:
   \`\`\`bash
   cp .env.example .env
   \`\`\`

4. Start development server:
   \`\`\`bash
   npm run dev
   \`\`\`

## First Week Checklist
- [ ] Complete environment setup
- [ ] Read architecture docs
- [ ] Join #dev-team Slack channel
- [ ] Schedule 1:1 with team lead
- [ ] Pick up a "good-first-issue" task

## Need Help?
- Check #dev-help Slack channel
- Ask your onboarding buddy
- Review the FAQ section
      `.trim(),
            keywords: ['setup', 'install', 'getting started', 'onboarding', 'new developer']
        },
        {
            id: 'architecture',
            title: 'System Architecture Overview',
            category: 'architecture',
            content: `
# System Architecture

## Overview
Our system follows a microservices architecture with the following core components:

## Frontend
- **Framework**: React 18 with TypeScript
- **State Management**: Redux Toolkit
- **Styling**: Tailwind CSS
- **Build Tool**: Vite

## Backend
- **API Layer**: Node.js with Express
- **Database**: PostgreSQL (primary), Redis (cache)
- **Message Queue**: RabbitMQ
- **Search**: Elasticsearch

## Infrastructure
- **Cloud**: AWS
- **Container Orchestration**: Kubernetes (EKS)
- **CI/CD**: GitHub Actions
- **Monitoring**: Datadog

## Key Directories
- \`/frontend\` - React application
- \`/backend\` - API services
- \`/shared\` - Shared types and utilities
- \`/infra\` - Terraform and K8s configs

## Data Flow
1. User → Frontend → API Gateway
2. API Gateway → Backend Services
3. Services → Database/Cache
4. Async jobs → Message Queue → Workers

## Contact Points
- Frontend: @alice (Slack)
- Backend: @bob (Slack)
- DevOps: @charlie (Slack)
      `.trim(),
            keywords: ['architecture', 'system design', 'microservices', 'frontend', 'backend']
        },
        {
            id: 'coding-standards',
            title: 'Coding Standards & Conventions',
            category: 'standards',
            content: `
# Coding Standards

## General Principles
- Write clean, readable code
- Follow DRY (Don't Repeat Yourself)
- Keep functions small and focused
- Write meaningful comments for complex logic

## Naming Conventions

### JavaScript/TypeScript
- Variables: camelCase (\`userName\`, \`isActive\`)
- Functions: camelCase (\`getUserData()\`)
- Classes: PascalCase (\`UserService\`)
- Constants: UPPER_SNAKE_CASE (\`MAX_RETRIES\`)
- Files: kebab-case (\`user-service.ts\`)

### Database
- Tables: snake_case (\`user_profiles\`)
- Columns: snake_case (\`created_at\`)

## Git Workflow
1. Create feature branch from \`main\`
2. Branch naming: \`feature/ABC-123-description\`
3. Commit messages: \`type(scope): description\`
4. Open PR with description template
5. Get 2 approvals before merge
6. Squash merge to main

## Pull Request Guidelines
- Include ticket number in title
- Fill out PR template completely
- Add screenshots for UI changes
- Request review from code owners
- Keep PRs small (< 400 lines)

## Testing Requirements
- Unit tests for business logic
- Integration tests for API endpoints
- E2E tests for critical user flows
- Minimum 80% code coverage
      `.trim(),
            keywords: ['coding', 'standards', 'conventions', 'git', 'naming', 'pr', 'pull request']
        },
        {
            id: 'faq',
            title: 'Frequently Asked Questions',
            category: 'faq',
            content: `
# FAQ - Frequently Asked Questions

## Development

**Q: How do I run tests?**
A: Use \`npm test\` for unit tests, \`npm run test:e2e\` for end-to-end tests.

**Q: How do I connect to the staging database?**
A: Use the VPN and run \`npm run db:connect:staging\`. Credentials in 1Password.

**Q: My local environment is broken, what do I do?**
A: Try \`npm run clean && npm install\`. If that fails, delete node_modules and try again.

**Q: How do I get API keys for development?**
A: Ask in #dev-help Slack channel. Someone will add you to the dev team in 1Password.

## Process

**Q: How do I request a code review?**
A: Open a PR and add the \`needs-review\` label. Code owners are auto-assigned.

**Q: What's the deploy schedule?**
A: We deploy to staging daily at 2pm. Production deploys are Tuesday/Thursday.

**Q: How do I report a bug?**
A: Create a GitHub issue with the \`bug\` label. Include steps to reproduce.

## Team

**Q: Who should I ask about X?**
A: Check the CODEOWNERS file or ask in #dev-help. Key contacts:
- Frontend: Alice (@alice)
- Backend: Bob (@bob)
- DevOps: Charlie (@charlie)
- Product: Diana (@diana)

**Q: When are standups?**
A: Daily at 10am in the #standups Slack channel (async).
      `.trim(),
            keywords: ['faq', 'help', 'questions', 'how to', 'problem']
        }
    ]
};

// ==================== SEARCH FUNCTIONS ====================

function searchDocs(query, category = null) {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    let results = DOCS_STORE.documents.filter(doc => {
        if (category && doc.category !== category) return false;

        const searchText = `${doc.title} ${doc.content} ${doc.keywords.join(' ')}`.toLowerCase();
        return queryWords.some(word => searchText.includes(word));
    });

    // Score results by relevance
    results = results.map(doc => {
        let score = 0;
        const searchText = `${doc.title} ${doc.content}`.toLowerCase();

        queryWords.forEach(word => {
            if (doc.title.toLowerCase().includes(word)) score += 10;
            if (doc.keywords.some(k => k.includes(word))) score += 5;
            const matches = (searchText.match(new RegExp(word, 'g')) || []).length;
            score += matches;
        });

        return { ...doc, score };
    });

    // Sort by score
    results.sort((a, b) => b.score - a.score);

    return results.slice(0, 5).map(doc => ({
        id: doc.id,
        title: doc.title,
        category: doc.category,
        excerpt: doc.content.substring(0, 200) + '...',
        score: doc.score
    }));
}

function getDocument(docId) {
    const doc = DOCS_STORE.documents.find(d => d.id === docId);
    if (!doc) return null;
    return {
        id: doc.id,
        title: doc.title,
        category: doc.category,
        content: doc.content
    };
}

function getOnboardingChecklist() {
    return {
        title: 'New Developer Onboarding Checklist',
        phases: [
            {
                name: 'Day 1: Environment Setup',
                tasks: [
                    'Clone the repository',
                    'Install dependencies (npm install)',
                    'Set up environment variables (.env)',
                    'Run the project locally',
                    'Install recommended VSCode extensions'
                ]
            },
            {
                name: 'Day 2-3: Codebase Exploration',
                tasks: [
                    'Read this architecture document',
                    'Explore the main directories',
                    'Run and understand existing tests',
                    'Review recent pull requests'
                ]
            },
            {
                name: 'Day 4-5: Team Integration',
                tasks: [
                    'Join Slack channels (#dev-team, #dev-help)',
                    'Schedule 1:1 with team lead',
                    'Meet your onboarding buddy',
                    'Pick up your first task (good-first-issue)'
                ]
            },
            {
                name: 'Week 2: First Contribution',
                tasks: [
                    'Complete your first PR',
                    'Get feedback from code review',
                    'Attend sprint planning',
                    'Document any setup issues you encountered'
                ]
            }
        ]
    };
}

// ==================== MCP SERVER ====================

const server = new Server(
    {
        name: 'docs-mcp',
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
                name: 'search_docs',
                description: 'Search internal documentation for answers to questions',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: { type: 'string', description: 'Search query' },
                        category: {
                            type: 'string',
                            description: 'Filter by category (onboarding, architecture, standards, faq)',
                            enum: ['onboarding', 'architecture', 'standards', 'faq']
                        }
                    },
                    required: ['query']
                }
            },
            {
                name: 'get_document',
                description: 'Get full content of a specific document',
                inputSchema: {
                    type: 'object',
                    properties: {
                        docId: { type: 'string', description: 'Document ID' }
                    },
                    required: ['docId']
                }
            },
            {
                name: 'get_onboarding_checklist',
                description: 'Get the step-by-step onboarding checklist for new developers',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'list_all_docs',
                description: 'List all available documentation',
                inputSchema: {
                    type: 'object',
                    properties: {}
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
            case 'search_docs':
                result = searchDocs(args.query, args.category);
                break;
            case 'get_document':
                result = getDocument(args.docId);
                if (!result) {
                    result = { error: 'Document not found' };
                }
                break;
            case 'get_onboarding_checklist':
                result = getOnboardingChecklist();
                break;
            case 'list_all_docs':
                result = DOCS_STORE.documents.map(d => ({
                    id: d.id,
                    title: d.title,
                    category: d.category
                }));
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
    const PORT = process.env.PORT;
    if (PORT) {
        const app = express();
        let transport;
        app.get('/sse', async (req, res) => {
            transport = new SSEServerTransport('/message', res);
            await server.connect(transport);
        });
        app.post('/sse', async (req, res) => {
            if (transport) await transport.handlePostMessage(req, res);
        });
        app.post('/message', async (req, res) => {
            if (transport) await transport.handlePostMessage(req, res);
        });
        app.listen(PORT, '0.0.0.0', () => {
            console.error(`Docs MCP Server running on http://0.0.0.0:${PORT}/sse`);
        });
    } else {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error('Docs MCP Server running on stdio');
    }
}

main().catch(console.error);
