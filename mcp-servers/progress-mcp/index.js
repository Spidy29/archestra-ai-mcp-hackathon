import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import express from 'express';
import {
    CallToolRequestSchema,
    ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';

// ==================== IN-MEMORY PROGRESS STORE ====================
// In production, this would persist to a database

const progressStore = new Map();

function getDefaultProgress(devName) {
    return {
        developer: devName,
        startDate: new Date().toISOString().split('T')[0],
        phases: [
            {
                name: '🔧 Day 1: Environment Setup',
                status: 'in_progress',
                tasks: [
                    { id: 'env-1', title: 'Clone the repository', done: false },
                    { id: 'env-2', title: 'Install dependencies (npm install)', done: false },
                    { id: 'env-3', title: 'Set up environment variables (.env)', done: false },
                    { id: 'env-4', title: 'Run the project locally', done: false },
                    { id: 'env-5', title: 'Install recommended VSCode extensions', done: false },
                ],
            },
            {
                name: '📖 Day 2-3: Codebase Exploration',
                status: 'not_started',
                tasks: [
                    { id: 'code-1', title: 'Read architecture documentation', done: false },
                    { id: 'code-2', title: 'Explore main directories', done: false },
                    { id: 'code-3', title: 'Run and understand existing tests', done: false },
                    { id: 'code-4', title: 'Review recent pull requests', done: false },
                ],
            },
            {
                name: '👥 Day 4-5: Team Integration',
                status: 'not_started',
                tasks: [
                    { id: 'team-1', title: 'Join Slack channels (#dev-team, #dev-help)', done: false },
                    { id: 'team-2', title: 'Schedule 1:1 with team lead', done: false },
                    { id: 'team-3', title: 'Meet your onboarding buddy', done: false },
                    { id: 'team-4', title: 'Pick up first task (good-first-issue)', done: false },
                ],
            },
            {
                name: '🚀 Week 2: First Contribution',
                status: 'not_started',
                tasks: [
                    { id: 'contrib-1', title: 'Complete your first PR', done: false },
                    { id: 'contrib-2', title: 'Get code review feedback', done: false },
                    { id: 'contrib-3', title: 'Attend sprint planning', done: false },
                    { id: 'contrib-4', title: 'Document setup issues encountered', done: false },
                ],
            },
        ],
        achievements: [],
    };
}

function getOrCreateProgress(devName) {
    if (!progressStore.has(devName)) {
        progressStore.set(devName, getDefaultProgress(devName));
    }
    return progressStore.get(devName);
}

function calculateStats(progress) {
    let totalTasks = 0;
    let completedTasks = 0;
    let currentPhase = 'Not started';

    progress.phases.forEach((phase) => {
        phase.tasks.forEach((task) => {
            totalTasks++;
            if (task.done) completedTasks++;
        });
        if (phase.status === 'in_progress') {
            currentPhase = phase.name;
        }
    });

    const percentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;
    const progressBar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));

    return {
        totalTasks,
        completedTasks,
        percentage,
        progressBar: `[${progressBar}] ${percentage}%`,
        currentPhase,
        estimatedDaysLeft: Math.max(0, Math.ceil((totalTasks - completedTasks) / 3)),
    };
}

function markTaskComplete(devName, taskId) {
    const progress = getOrCreateProgress(devName);
    let found = false;
    let taskTitle = '';

    for (const phase of progress.phases) {
        for (const task of phase.tasks) {
            if (task.id === taskId) {
                task.done = true;
                found = true;
                taskTitle = task.title;
                break;
            }
        }
        if (found) break;
    }

    if (!found) {
        return { success: false, error: `Task "${taskId}" not found` };
    }

    // Update phase statuses
    progress.phases.forEach((phase) => {
        const allDone = phase.tasks.every((t) => t.done);
        const anyDone = phase.tasks.some((t) => t.done);

        if (allDone) {
            phase.status = 'completed';
        } else if (anyDone) {
            phase.status = 'in_progress';
        } else {
            phase.status = 'not_started';
        }
    });

    // Check for achievements
    const stats = calculateStats(progress);
    const newAchievements = [];

    if (stats.percentage >= 25 && !progress.achievements.includes('🌱 Quick Starter')) {
        progress.achievements.push('🌱 Quick Starter');
        newAchievements.push('🌱 Quick Starter - Completed 25% of onboarding!');
    }
    if (stats.percentage >= 50 && !progress.achievements.includes('⚡ Halfway Hero')) {
        progress.achievements.push('⚡ Halfway Hero');
        newAchievements.push('⚡ Halfway Hero - 50% done!');
    }
    if (stats.percentage >= 75 && !progress.achievements.includes('🔥 Almost There')) {
        progress.achievements.push('🔥 Almost There');
        newAchievements.push('🔥 Almost There - 75% complete!');
    }
    if (stats.percentage === 100 && !progress.achievements.includes('🏆 Onboarding Champion')) {
        progress.achievements.push('🏆 Onboarding Champion');
        newAchievements.push('🏆 Onboarding Champion - You did it!');
    }

    return {
        success: true,
        message: `✅ Completed: "${taskTitle}"`,
        newAchievements: newAchievements.length > 0 ? newAchievements : undefined,
        stats: calculateStats(progress),
    };
}

function getProgressDashboard(devName) {
    const progress = getOrCreateProgress(devName);
    const stats = calculateStats(progress);

    return {
        developer: progress.developer,
        startDate: progress.startDate,
        stats,
        phases: progress.phases.map((phase) => ({
            name: phase.name,
            status: phase.status === 'completed' ? '✅' : phase.status === 'in_progress' ? '🔄' : '⏳',
            progress: `${phase.tasks.filter((t) => t.done).length}/${phase.tasks.length}`,
            tasks: phase.tasks.map((t) => ({
                id: t.id,
                title: t.title,
                status: t.done ? '✅' : '⬜',
            })),
        })),
        achievements: progress.achievements,
    };
}

function getNextTasks(devName) {
    const progress = getOrCreateProgress(devName);
    const nextTasks = [];

    for (const phase of progress.phases) {
        for (const task of phase.tasks) {
            if (!task.done) {
                nextTasks.push({
                    id: task.id,
                    title: task.title,
                    phase: phase.name,
                });
                if (nextTasks.length >= 3) break;
            }
        }
        if (nextTasks.length >= 3) break;
    }

    return {
        developer: devName,
        nextTasks,
        tip: nextTasks.length > 0
            ? 'Focus on these tasks next. Complete them one at a time!'
            : '🎉 All tasks completed! You are fully onboarded!',
    };
}

// ==================== MCP SERVER ====================

const server = new Server(
    {
        name: 'progress-mcp',
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
                name: 'get_progress_dashboard',
                description: "Get the developer's full onboarding progress dashboard with stats, phases, and achievements",
                inputSchema: {
                    type: 'object',
                    properties: {
                        devName: {
                            type: 'string',
                            description: 'Name of the developer',
                        },
                    },
                    required: ['devName'],
                },
            },
            {
                name: 'complete_task',
                description: 'Mark an onboarding task as completed. May unlock achievements!',
                inputSchema: {
                    type: 'object',
                    properties: {
                        devName: {
                            type: 'string',
                            description: 'Name of the developer',
                        },
                        taskId: {
                            type: 'string',
                            description: 'ID of the task to mark complete (e.g., "env-1", "code-2")',
                        },
                    },
                    required: ['devName', 'taskId'],
                },
            },
            {
                name: 'get_next_tasks',
                description: 'Get the next 3 tasks the developer should focus on',
                inputSchema: {
                    type: 'object',
                    properties: {
                        devName: {
                            type: 'string',
                            description: 'Name of the developer',
                        },
                    },
                    required: ['devName'],
                },
            },
            {
                name: 'get_leaderboard',
                description: 'Get onboarding leaderboard showing all developers and their progress',
                inputSchema: {
                    type: 'object',
                    properties: {},
                },
            },
        ],
    };
});

server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
        let result;

        switch (name) {
            case 'get_progress_dashboard':
                result = getProgressDashboard(args.devName);
                break;

            case 'complete_task':
                result = markTaskComplete(args.devName, args.taskId);
                break;

            case 'get_next_tasks':
                result = getNextTasks(args.devName);
                break;

            case 'get_leaderboard': {
                const entries = [];
                for (const [devName, progress] of progressStore) {
                    const stats = calculateStats(progress);
                    entries.push({
                        developer: devName,
                        progress: stats.progressBar,
                        completed: `${stats.completedTasks}/${stats.totalTasks}`,
                        achievements: progress.achievements.length,
                    });
                }
                entries.sort((a, b) => b.completed.split('/')[0] - a.completed.split('/')[0]);

                result = {
                    leaderboard: entries.length > 0 ? entries : [{ message: 'No developers tracked yet. Start by getting a progress dashboard!' }],
                    totalDevelopers: progressStore.size,
                };
                break;
            }

            default:
                return {
                    content: [{ type: 'text', text: `Unknown tool: ${name}` }],
                    isError: true,
                };
        }

        return {
            content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
        };
    } catch (error) {
        return {
            content: [{ type: 'text', text: `Error: ${error.message}` }],
            isError: true,
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
            console.error(`Progress MCP Server running on http://0.0.0.0:${PORT}/sse`);
        });
    } else {
        const transport = new StdioServerTransport();
        await server.connect(transport);
        console.error('Progress MCP Server running on stdio');
    }
}

main().catch(console.error);
