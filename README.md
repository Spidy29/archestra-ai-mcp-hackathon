# 🚀 OnboardingOS

> **"Your AI buddy that turns weeks of onboarding into hours"**

[![Built for 2 Fast 2 MCP](https://img.shields.io/badge/🏁_Hackathon-2_Fast_2_MCP-ff6b6b)](https://wemakedevs.org)
[![Powered by Archestra](https://img.shields.io/badge/Powered%20by-Archestra-purple)](https://archestra.ai)
[![MCP](https://img.shields.io/badge/Protocol-MCP-green)](https://modelcontextprotocol.io)

---

## 🎯 The Problem

New developers take **2-4 weeks** to become productive:
- 😫 Hours spent setting up dev environment
- 🤷 "Who should I ask about this code?"
- 📚 Outdated documentation
- 🔄 Tribal knowledge lost when seniors leave

## 💡 The Solution

**OnboardingOS** is an AI-powered onboarding assistant that:
- 📁 Explains codebase architecture instantly
- 🛠️ Sets up development environment automatically  
- 👥 Connects you with the right experts
- ✅ Guides through first tasks step-by-step

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                 ARCHESTRA PLATFORM                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐   │
│  │ Chat UI  │  │ Security │  │    Observability     │   │
│  └──────────┘  └──────────┘  └──────────────────────┘   │
│                        │                                 │
│  ┌───────────────────────────────────────────────────┐  │
│  │              OnboardingOS Agent                    │  │
│  └───────────────────────────────────────────────────┘  │
│          │           │           │           │          │
│     ┌────┴───┐  ┌────┴───┐  ┌────┴───┐  ┌────┴───┐     │
│     │ GitHub │  │  Docs  │  │Terminal│  │ Slack  │     │
│     │  MCP   │  │  MCP   │  │  MCP   │  │  MCP   │     │
│     └────────┘  └────────┘  └────────┘  └────────┘     │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ MCP Servers

| Server | Tools | Purpose |
|--------|-------|---------|
| **GitHub MCP** | 5 | Explain code, find files, identify owners |
| **Docs MCP** | 4 | Search docs, onboarding checklist |
| **Terminal MCP** | 5 | Environment check, setup automation |
| **Slack MCP** | 5 | Find experts, search discussions |

**Total: 19 tools** for comprehensive onboarding support!

---

## 🚀 Quick Start

### Prerequisites
- Docker Desktop
- Node.js 18+

### 1. Start Archestra Platform
```bash
docker pull archestra/platform:latest
docker run -d --name archestra \
  -p 9000:9000 -p 3000:3000 \
  -e ARCHESTRA_QUICKSTART=true \
  -v /var/run/docker.sock:/var/run/docker.sock \
  archestra/platform
```

### 2. Install Dependencies
```bash
cd mcp-servers/github-mcp && npm install
cd ../docs-mcp && npm install
cd ../terminal-mcp && npm install
cd ../slack-mcp && npm install
```

### 3. Access the UI
Open http://localhost:3000

---

## 📁 Project Structure

```
├── mcp-servers/
│   ├── github-mcp/     # Codebase understanding
│   ├── docs-mcp/       # Documentation search
│   ├── terminal-mcp/   # Environment setup
│   └── slack-mcp/      # Team integration
└── agent-config/       # Agent personality
```

---

## 🔐 Security Features

- ✅ **Approval Required** for dangerous commands
- ✅ **Dual LLM** isolation for tool outputs
- ✅ **Cost Optimization** - smart model routing
- ✅ **Observability** - full audit trail

---

## 🎬 Demo

```
User: "I just joined the team. How do I get started?"

OnboardingOS:
→ Checks your dev environment ✅
→ Shows onboarding checklist 📋
→ Explains repo structure 📁
→ Suggests who to contact 👥
```

---

## 🏁 Built For

<p align="center">
  <b>2 Fast 2 MCP</b> — Online Hackathon by <a href="https://wemakedevs.org">WeMakeDevs</a><br/>
  Powered by <a href="https://archestra.ai">Archestra</a> • MCP-based Agent Orchestration
</p>

---

## 📄 License

MIT License
