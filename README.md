# 🚀 OnboardingOS — Zero-to-Productive Developer Agent

> **"Your AI buddy that turns weeks of onboarding into hours"**

[![Built for 2 Fast 2 MCP](https://img.shields.io/badge/🏁_Hackathon-2_Fast_2_MCP-ff6b6b)](https://wemakedevs.org)
[![Powered by Archestra](https://img.shields.io/badge/Powered%20by-Archestra-purple)](https://archestra.ai)
[![MCP](https://img.shields.io/badge/Protocol-MCP-green)](https://modelcontextprotocol.io)
[![Tools](https://img.shields.io/badge/MCP_Tools-23-blue)]()
[![Servers](https://img.shields.io/badge/MCP_Servers-5-orange)]()

---

## 🎯 The Problem

New developers take **2-4 weeks** to become productive. Every company loses **$50K+** per hire in onboarding time.

| Pain Point | Impact |
|------------|--------|
| 😫 Setting up dev environment | 30+ mins daily |
| 🤷 "Who should I ask about this?" | Hours wasted finding the right person |
| 📚 Outdated documentation | Wrong answers, more confusion |
| 🔄 Tribal knowledge lost | When seniors leave, knowledge goes too |
| 📊 No progress visibility | Managers can't track onboarding |

## 💡 The Solution

**OnboardingOS** is an AI-powered onboarding assistant built on **Archestra's MCP platform** that:

- 📁 **Explains codebase architecture** instantly via GitHub
- 🛠️ **Sets up development environment** automatically with safety checks
- 📖 **Searches internal docs** for answers to any question
- 👥 **Connects you with the right experts** via Slack
- 📊 **Tracks onboarding progress** with gamification & achievements

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                    ARCHESTRA PLATFORM                            │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────────────┐   │
│  │ Chat UI  │  │   Security   │  │     Observability        │   │
│  │ (port    │  │  (Dual LLM,  │  │  (Metrics, Traces,       │   │
│  │  3000)   │  │  Approvals)  │  │   Cost Monitoring)       │   │
│  └──────────┘  └──────────────┘  └──────────────────────────┘   │
│                         │                                        │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │              🤖 OnboardingOS Agent                        │   │
│  │   "Friendly Onboarding Buddy" with Smart Routing          │   │
│  └──────────────────────────────────────────────────────────┘   │
│       │          │          │          │          │              │
│  ┌────┴───┐ ┌────┴───┐ ┌────┴───┐ ┌────┴───┐ ┌────┴────┐      │
│  │ GitHub │ │  Docs  │ │Terminal│ │ Slack  │ │Progress │      │
│  │  MCP   │ │  MCP   │ │  MCP   │ │  MCP   │ │  MCP    │      │
│  │ 5 tools│ │ 4 tools│ │ 5 tools│ │ 5 tools│ │ 4 tools │      │
│  └────────┘ └────────┘ └────────┘ └────────┘ └─────────┘      │
└──────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ MCP Servers (5 Servers, 23 Tools)

### 1. 📂 GitHub MCP — Codebase Understanding
| Tool | Description |
|------|-------------|
| `explain_repo_structure` | Analyze folder layout, languages, key files |
| `find_file` | Search files by name across the repo |
| `explain_code` | Get file contents with context for explanation |
| `get_recent_prs` | View recent PRs to understand team patterns |
| `who_owns_code` | Find who's the expert on specific code |

### 2. 📖 Docs MCP — Documentation Search
| Tool | Description |
|------|-------------|
| `search_docs` | Full-text search with relevance scoring |
| `get_document` | Retrieve complete document by ID |
| `get_onboarding_checklist` | Phased onboarding checklist |
| `list_all_docs` | Browse all available documentation |

### 3. 🖥️ Terminal MCP — Environment Setup
| Tool | Description |
|------|-------------|
| `check_dev_environment` | Verify Node, NPM, Git, Docker are installed |
| `get_setup_instructions` | Step-by-step fix guides |
| `run_safe_command` | Execute read-only commands safely |
| `run_setup_command` | ⚠️ **REQUIRES APPROVAL** — system-modifying commands |
| `suggest_next_steps` | Context-aware recommendations |

### 4. 💬 Slack MCP — Team Integration
| Tool | Description |
|------|-------------|
| `find_expert` | Match topics to team experts |
| `search_discussions` | Find answers from past conversations |
| `list_channels` | Show channels to join |
| `send_welcome_message` | ⚠️ **REQUIRES APPROVAL** — post to Slack |
| `get_team_contacts` | Full team directory with availability |

### 5. 📊 Progress MCP — Onboarding Tracker *(NEW!)*
| Tool | Description |
|------|-------------|
| `get_progress_dashboard` | Visual progress with stats & achievements |
| `complete_task` | Mark tasks done — may unlock achievements! 🏆 |
| `get_next_tasks` | Get top 3 recommended next actions |
| `get_leaderboard` | Compare progress across all new hires |

---

## 🔐 Security Features (Archestra Integration)

| Feature | Implementation |
|---------|---------------|
| ✅ **Approval Required** | `run_setup_command` and `send_welcome_message` need explicit user approval |
| ✅ **Dual LLM Isolation** | Tool outputs are processed through security sub-agent |
| ✅ **Safe Command Whitelist** | Only pre-approved commands can run without approval |
| ✅ **Cost Optimization** | Smart routing — cheap models for lookups, expensive for synthesis |
| ✅ **Full Observability** | Track tool usage, popular docs, common issues, completion rates |

---

## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- Node.js 18+
- GitHub Personal Access Token ([create one](https://github.com/settings/tokens))

### Option 1: Docker Compose (Recommended)
```bash
# Clone the repo
git clone https://github.com/spidy29/archestra-ai-mcp-hackathon.git
cd archestra-ai-mcp-hackathon

# Set up environment
cp .env.example .env
# Edit .env and add your GITHUB_TOKEN

# Start everything
docker-compose up -d

# Access UI at http://localhost:3000
```

### Option 2: Manual Setup
```bash
# 1. Start Archestra Platform
docker pull archestra/platform:latest
docker run -d --name archestra \
  -p 9000:9000 -p 3000:3000 \
  -e ARCHESTRA_QUICKSTART=true \
  -v /var/run/docker.sock:/var/run/docker.sock \
  archestra/platform

# 2. Install all MCP server dependencies
cd mcp-servers/github-mcp && npm install && cd ../..
cd mcp-servers/docs-mcp && npm install && cd ../..
cd mcp-servers/terminal-mcp && npm install && cd ../..
cd mcp-servers/slack-mcp && npm install && cd ../..
cd mcp-servers/progress-mcp && npm install && cd ../..

# 3. Test all servers
node test-servers.js
```

---

## 📁 Project Structure

```
archestra-hackathon/
├── agent-config/
│   └── agent.json          # 🤖 Agent personality & MCP config
├── mcp-servers/
│   ├── github-mcp/         # 📂 Codebase understanding (5 tools)
│   ├── docs-mcp/           # 📖 Documentation search (4 tools)
│   ├── terminal-mcp/       # 🖥️ Environment setup (5 tools)
│   ├── slack-mcp/          # 💬 Team integration (5 tools)
│   └── progress-mcp/       # 📊 Progress tracking (4 tools)
├── docker-compose.yml       # 🐳 One-command setup
├── test-servers.js          # ✅ Server verification
├── .env.example             # 🔑 Environment template
└── README.md                # 📄 You are here!
```

---

## 🎬 Demo Scenario

```
👤 User: "I just joined the team. How do I get started?"

🤖 OnboardingOS:
  → Checks dev environment      ✅ Node 18, Git, Docker found
  → Shows onboarding checklist  📋 4 phases, 17 tasks  
  → Explains repo structure     📁 React + Node.js monorepo
  → Suggests who to contact     👥 @alice (Frontend), @bob (Backend)
  → Creates progress dashboard  📊 [░░░░░░░░░░░░░░░░░░░░] 0%

👤 User: "I've cloned the repo and installed deps"

🤖 OnboardingOS:
  → Marks tasks complete        ✅ 2 tasks done!
  → Unlocks achievement        🌱 Quick Starter!
  → Shows next steps           📋 "Set up .env file next"
  → Progress update            📊 [██████░░░░░░░░░░░░░░] 12%
```

---

## 📊 Observability Metrics

OnboardingOS tracks these metrics via Archestra's observability:

- **Tools used per session** — Which tools are most valuable?
- **Most searched docs** — Which docs need improvement?
- **Common setup issues** — What breaks most often?
- **Expert lookup topics** — What knowledge gaps exist?
- **Onboarding completion rate** — How fast are devs ramping up?

---

## 🏁 Built For

<p align="center">
  <b>2 Fast 2 MCP</b> — Online Hackathon by <a href="https://wemakedevs.org">WeMakeDevs</a><br/>
  Powered by <a href="https://archestra.ai">Archestra</a> • MCP-based Agent Orchestration<br/>
  <b>Speed Racer Category (Solo)</b> 🏎️
</p>

---

## 📄 License

MIT License
