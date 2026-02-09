import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Octokit } from 'octokit';

// Initialize Octokit (GitHub API client)
const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN
});

// Create MCP Server
const server = new Server(
  {
    name: 'github-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// ==================== TOOLS ====================

// Tool: Explain Repository Structure
async function explainRepoStructure(owner, repo) {
  try {
    // Get repo info
    const { data: repoInfo } = await octokit.rest.repos.get({ owner, repo });
    
    // Get root directory contents
    const { data: contents } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: ''
    });
    
    // Get languages used
    const { data: languages } = await octokit.rest.repos.listLanguages({ owner, repo });
    
    // Build structure summary
    const folders = contents.filter(item => item.type === 'dir').map(d => d.name);
    const files = contents.filter(item => item.type === 'file').map(f => f.name);
    
    return {
      name: repoInfo.name,
      description: repoInfo.description || 'No description provided',
      languages: Object.keys(languages),
      primaryLanguage: Object.keys(languages)[0] || 'Unknown',
      folders: folders,
      rootFiles: files,
      defaultBranch: repoInfo.default_branch,
      stars: repoInfo.stargazers_count,
      hasReadme: files.includes('README.md'),
      hasPackageJson: files.includes('package.json'),
      structure: `
📁 ${repo}/
${folders.map(f => `├── 📁 ${f}/`).join('\n')}
${files.map(f => `├── 📄 ${f}`).join('\n')}
      `.trim()
    };
  } catch (error) {
    return { error: `Failed to analyze repo: ${error.message}` };
  }
}

// Tool: Find File in Repository
async function findFile(owner, repo, filename) {
  try {
    const { data } = await octokit.rest.search.code({
      q: `filename:${filename} repo:${owner}/${repo}`,
      per_page: 10
    });
    
    return {
      found: data.total_count,
      files: data.items.map(item => ({
        path: item.path,
        url: item.html_url
      }))
    };
  } catch (error) {
    return { error: `Failed to search: ${error.message}` };
  }
}

// Tool: Explain Code (get file contents with explanation context)
async function explainCode(owner, repo, path) {
  try {
    const { data } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path
    });
    
    if (data.type !== 'file') {
      return { error: 'Path is not a file' };
    }
    
    const content = Buffer.from(data.content, 'base64').toString('utf-8');
    const lines = content.split('\n').length;
    const extension = path.split('.').pop();
    
    return {
      path: path,
      extension: extension,
      lines: lines,
      size: data.size,
      content: content.substring(0, 3000), // Limit content size
      truncated: content.length > 3000
    };
  } catch (error) {
    return { error: `Failed to get file: ${error.message}` };
  }
}

// Tool: Get Recent PRs
async function getRecentPRs(owner, repo, count = 5) {
  try {
    const { data } = await octokit.rest.pulls.list({
      owner,
      repo,
      state: 'all',
      sort: 'updated',
      direction: 'desc',
      per_page: count
    });
    
    return {
      pullRequests: data.map(pr => ({
        number: pr.number,
        title: pr.title,
        author: pr.user.login,
        state: pr.state,
        merged: pr.merged_at !== null,
        url: pr.html_url
      }))
    };
  } catch (error) {
    return { error: `Failed to get PRs: ${error.message}` };
  }
}

// Tool: Who Owns Code (find contributors for a file/path)
async function whoOwnsCode(owner, repo, path) {
  try {
    const { data: commits } = await octokit.rest.repos.listCommits({
      owner,
      repo,
      path,
      per_page: 20
    });
    
    // Count commits per author
    const authorCounts = {};
    commits.forEach(commit => {
      const author = commit.author?.login || commit.commit.author?.name || 'Unknown';
      authorCounts[author] = (authorCounts[author] || 0) + 1;
    });
    
    // Sort by commit count
    const sortedAuthors = Object.entries(authorCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([author, count]) => ({ author, commits: count }));
    
    return {
      path: path,
      topContributors: sortedAuthors.slice(0, 5),
      recentCommit: commits[0] ? {
        author: commits[0].author?.login || 'Unknown',
        message: commits[0].commit.message.split('\n')[0],
        date: commits[0].commit.author.date
      } : null
    };
  } catch (error) {
    return { error: `Failed to get code owners: ${error.message}` };
  }
}

// ==================== REGISTER TOOLS ====================

server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'explain_repo_structure',
        description: 'Analyze and explain the structure of a GitHub repository. Returns folder layout, languages used, and key files.',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner (username or org)' },
            repo: { type: 'string', description: 'Repository name' }
          },
          required: ['owner', 'repo']
        }
      },
      {
        name: 'find_file',
        description: 'Search for files by name in a repository',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            filename: { type: 'string', description: 'File name to search for (can be partial)' }
          },
          required: ['owner', 'repo', 'filename']
        }
      },
      {
        name: 'explain_code',
        description: 'Get the contents of a file to explain what it does',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            path: { type: 'string', description: 'File path in the repository' }
          },
          required: ['owner', 'repo', 'path']
        }
      },
      {
        name: 'get_recent_prs',
        description: 'Get recent pull requests to understand team patterns and recent changes',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            count: { type: 'number', description: 'Number of PRs to fetch (default 5)' }
          },
          required: ['owner', 'repo']
        }
      },
      {
        name: 'who_owns_code',
        description: 'Find out who are the main contributors/owners of a specific file or directory',
        inputSchema: {
          type: 'object',
          properties: {
            owner: { type: 'string', description: 'Repository owner' },
            repo: { type: 'string', description: 'Repository name' },
            path: { type: 'string', description: 'File or directory path' }
          },
          required: ['owner', 'repo', 'path']
        }
      }
    ]
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  
  try {
    let result;
    
    switch (name) {
      case 'explain_repo_structure':
        result = await explainRepoStructure(args.owner, args.repo);
        break;
      case 'find_file':
        result = await findFile(args.owner, args.repo, args.filename);
        break;
      case 'explain_code':
        result = await explainCode(args.owner, args.repo, args.path);
        break;
      case 'get_recent_prs':
        result = await getRecentPRs(args.owner, args.repo, args.count);
        break;
      case 'who_owns_code':
        result = await whoOwnsCode(args.owner, args.repo, args.path);
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

// ==================== START SERVER ====================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('GitHub MCP Server running on stdio');
}

main().catch(console.error);
