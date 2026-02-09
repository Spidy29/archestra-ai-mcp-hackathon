import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// ==================== MOCK SLACK DATA ====================
// In production, this would connect to real Slack API

const TEAM_MEMBERS = [
    {
        id: 'U001',
        name: 'Alice Chen',
        username: 'alice',
        role: 'Senior Frontend Engineer',
        expertise: ['React', 'TypeScript', 'CSS', 'UI/UX', 'frontend', 'components'],
        channels: ['#frontend', '#dev-team', '#design'],
        timezone: 'PST',
        available: true
    },
    {
        id: 'U002',
        name: 'Bob Kumar',
        username: 'bob',
        role: 'Backend Lead',
        expertise: ['Node.js', 'PostgreSQL', 'API', 'backend', 'database', 'authentication'],
        channels: ['#backend', '#dev-team', '#architecture'],
        timezone: 'EST',
        available: true
    },
    {
        id: 'U003',
        name: 'Charlie Park',
        username: 'charlie',
        role: 'DevOps Engineer',
        expertise: ['Docker', 'Kubernetes', 'AWS', 'CI/CD', 'infrastructure', 'deployment'],
        channels: ['#devops', '#dev-team', '#incidents'],
        timezone: 'CST',
        available: false
    },
    {
        id: 'U004',
        name: 'Diana Singh',
        username: 'diana',
        role: 'Product Manager',
        expertise: ['product', 'requirements', 'roadmap', 'priorities', 'features'],
        channels: ['#product', '#dev-team', '#announcements'],
        timezone: 'PST',
        available: true
    },
    {
        id: 'U005',
        name: 'Erik Johnson',
        username: 'erik',
        role: 'QA Lead',
        expertise: ['testing', 'QA', 'automation', 'bugs', 'e2e', 'quality'],
        channels: ['#qa', '#dev-team'],
        timezone: 'EST',
        available: true
    }
];

const SLACK_CHANNELS = [
    { id: 'C001', name: 'dev-team', description: 'Main developer channel', members: 25 },
    { id: 'C002', name: 'dev-help', description: 'Get help with development questions', members: 30 },
    { id: 'C003', name: 'frontend', description: 'Frontend discussions', members: 10 },
    { id: 'C004', name: 'backend', description: 'Backend discussions', members: 12 },
    { id: 'C005', name: 'devops', description: 'DevOps and infrastructure', members: 8 },
    { id: 'C006', name: 'new-joiners', description: 'Welcome channel for new team members', members: 20 }
];

const MOCK_DISCUSSIONS = [
    {
        id: 'M001',
        channel: '#dev-help',
        author: 'alice',
        question: 'How do I set up the local development environment?',
        answer: 'Run npm install then copy .env.example to .env. After that npm run dev should work.',
        date: '2024-01-15',
        helpful: 12
    },
    {
        id: 'M002',
        channel: '#dev-help',
        author: 'bob',
        question: 'Database connection keeps timing out locally',
        answer: 'Make sure Docker is running and the postgres container is up. Try docker-compose up -d db',
        date: '2024-01-20',
        helpful: 8
    },
    {
        id: 'M003',
        channel: '#backend',
        author: 'bob',
        question: 'How does authentication work in this project?',
        answer: 'We use JWT tokens. Check /backend/src/auth for the implementation. Tokens expire after 24h.',
        date: '2024-01-22',
        helpful: 15
    },
    {
        id: 'M004',
        channel: '#frontend',
        author: 'alice',
        question: 'Best practices for state management?',
        answer: 'We use Redux Toolkit. Global state in /store, local state with useState. See docs/state-management.md',
        date: '2024-01-25',
        helpful: 10
    },
    {
        id: 'M005',
        channel: '#devops',
        author: 'charlie',
        question: 'How to deploy to staging?',
        answer: 'Push to staging branch. GitHub Actions will auto-deploy. Check #deployments for status.',
        date: '2024-01-28',
        helpful: 6
    }
];

// ==================== SEARCH FUNCTIONS ====================

function findExpert(topic) {
    const topicLower = topic.toLowerCase();

    const matches = TEAM_MEMBERS.map(member => {
        const score = member.expertise.filter(exp =>
            exp.toLowerCase().includes(topicLower) ||
            topicLower.includes(exp.toLowerCase())
        ).length;
        return { ...member, matchScore: score };
    }).filter(m => m.matchScore > 0)
        .sort((a, b) => b.matchScore - a.matchScore);

    if (matches.length === 0) {
        return {
            found: false,
            suggestion: 'Try asking in #dev-help channel',
            channels: ['#dev-help', '#dev-team']
        };
    }

    return {
        found: true,
        experts: matches.map(m => ({
            name: m.name,
            username: `@${m.username}`,
            role: m.role,
            available: m.available ? '🟢 Available' : '🔴 Away',
            expertise: m.expertise.join(', '),
            channels: m.channels.join(', ')
        })),
        tip: 'You can reach them in their channels or send a DM'
    };
}

function searchDiscussions(query) {
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    const matches = MOCK_DISCUSSIONS.map(discussion => {
        const searchText = `${discussion.question} ${discussion.answer}`.toLowerCase();
        const matchCount = queryWords.filter(word => searchText.includes(word)).length;
        return { ...discussion, relevance: matchCount };
    }).filter(d => d.relevance > 0)
        .sort((a, b) => b.relevance - a.relevance);

    return {
        found: matches.length,
        discussions: matches.slice(0, 5).map(d => ({
            channel: d.channel,
            question: d.question,
            answer: d.answer,
            author: `@${d.author}`,
            date: d.date,
            helpfulVotes: d.helpful
        }))
    };
}

function getChannels() {
    return SLACK_CHANNELS.map(ch => ({
        name: `#${ch.name}`,
        description: ch.description,
        members: ch.members
    }));
}

function welcomeNewMember(name) {
    return {
        action: 'WOULD_POST_MESSAGE',
        channel: '#new-joiners',
        message: `
👋 Welcome to the team, ${name}!

Here's what you should do first:
1. Join these channels: #dev-team, #dev-help
2. Read the Getting Started guide
3. Your onboarding buddy will reach out soon!

If you have questions, don't hesitate to ask in #dev-help.
We're excited to have you! 🎉
    `.trim(),
        note: 'In production, this would actually post to Slack'
    };
}

// ==================== MCP SERVER ====================

const server = new Server(
    {
        name: 'slack-mcp',
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
                name: 'find_expert',
                description: 'Find team members who are experts on a specific topic',
                inputSchema: {
                    type: 'object',
                    properties: {
                        topic: {
                            type: 'string',
                            description: 'Topic or technology to find an expert for (e.g., "React", "database", "deployment")'
                        }
                    },
                    required: ['topic']
                }
            },
            {
                name: 'search_discussions',
                description: 'Search past Slack discussions for answers to common questions',
                inputSchema: {
                    type: 'object',
                    properties: {
                        query: {
                            type: 'string',
                            description: 'Search query (e.g., "local setup", "authentication")'
                        }
                    },
                    required: ['query']
                }
            },
            {
                name: 'list_channels',
                description: 'List available Slack channels the new developer should join',
                inputSchema: {
                    type: 'object',
                    properties: {}
                }
            },
            {
                name: 'send_welcome_message',
                description: '⚠️ REQUIRES APPROVAL: Send a welcome message to the #new-joiners channel',
                inputSchema: {
                    type: 'object',
                    properties: {
                        name: {
                            type: 'string',
                            description: 'Name of the new team member'
                        }
                    },
                    required: ['name']
                }
            },
            {
                name: 'get_team_contacts',
                description: 'Get list of key team contacts and their roles',
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
            case 'find_expert':
                result = findExpert(args.topic);
                break;

            case 'search_discussions':
                result = searchDiscussions(args.query);
                break;

            case 'list_channels':
                result = {
                    channels: getChannels(),
                    recommended: ['#dev-team', '#dev-help', '#new-joiners']
                };
                break;

            case 'send_welcome_message':
                result = welcomeNewMember(args.name);
                break;

            case 'get_team_contacts':
                result = {
                    contacts: TEAM_MEMBERS.map(m => ({
                        name: m.name,
                        username: `@${m.username}`,
                        role: m.role,
                        expertise: m.expertise.slice(0, 3).join(', '),
                        available: m.available ? '🟢' : '🔴'
                    }))
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
    console.error('Slack MCP Server running on stdio');
}

main().catch(console.error);
