# MARCUS - The Universal n8n MCP Server 🤖

MARCUS (Model Context Protocol Server) is a centralized bridge between AI Agents and your n8n automation infrastructure. It enables LLMs (like Claude, ChatGPT, or custom agents) to autonomously inspect, control, and debug n8n workflows.

## 🚀 Key Features

*   **Universal Bridge:** Connects any MCP-compatible client to n8n.
*   **Dual Mode:** Supports both stateful **SSE** (Server-Sent Events) for interactive sessions and stateless **Webhooks** for simple integrations.
*   **Workflow Management:** List, create, activate, and execute workflows autonomously.
*   **Knowledge Access:** Search internal knowledge bases (Vector DBs) and inspect node capabilities.
*   **Debug & Monitoring:** Retrieve error logs and analyze execution history via Sherlock.
*   **Secure:** Bearer token authentication and environment-based configuration.

---

## 🛠️ Integrated Tools

MARCUS exposes the following tools to AI agents:

### 1. Workflow Control (`workflowTools.js`)
*   `list_workflows`: Get a list of all workflows on the instance.
*   `get_workflow`: Retrieve full JSON specification of a workflow.
*   `create_workflow`: Create new workflows from JSON specs.
*   `activate_workflow`: Enable/Disable workflows.
*   `execute_workflow`: Trigger a specific workflow with payload.
*   `search_node_types`: Find available n8n nodes (e.g., "http", "telegram").
*   `list_credentials`: Check available credentials.

### 2. System Monitoring (`sherlockTools.js`)
*   `get_error_incidents`: Fetch recent error logs and AI-analyzed root causes from the "Sherlock" monitoring system.

### 3. Knowledge Base (`n8nKnowledgeTools.js`, `optigemTools.js`)
*   `search_n8n_knowledge`: Query vector store for internal documentation and patterns.
*   `query_optigem`: Search member/event data in the Optigem CRM.

---

## 📦 Installation

### Option A: Docker (Recommended)

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/sschuerg/marcus-mcp.git
    cd marcus-mcp
    ```

2.  **Configure Environment:**
    Copy the example file and fill in your credentials.
    ```bash
    cp .env.example .env
    nano .env
    ```

3.  **Build & Run:**
    ```bash
    docker build -t marcus-mcp .
    docker run -d -p 3000:3000 --env-file .env --name marcus-mcp marcus-mcp
    ```

### Option B: Local Node.js

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Start Server:**
    ```bash
    node src/index.js
    ```

---

## ⚙️ Configuration (.env)

| Variable | Description | Example |
| : | : | : |
| `PORT` | Server Port | `3000` |
| `N8N_API_BASE_URL` | URL to your n8n API | `https://n8n.your-company.com/api/v1` |
| `N8N_API_KEY` | Your n8n API Key | `eyJhbGciOiJIUz...` |
| `MCP_BEARER_TOKEN` | Token to secure MARCUS | `sds0614271239` |
| `LOG_LEVEL` | Logging verbosity | `info` |

---

## 🔌 Usage

### 1. AI Agent Integration (SSE)
Configure your MCP Client (e.g., n8n AI Agent Node, Claude Desktop) with:
*   **Type:** SSE (Server-Sent Events)
*   **URL:** `http://localhost:3000/sse`
*   **Auth:** Bearer Token (from your `.env`)

### 2. Stateless Webhook (HTTP)
You can call tools directly via HTTP POST without a persistent session.

**Endpoint:** `POST /webhook`

**Payload:**
```json
{
  "tool": "list_workflows",
  "args": {}
}
```

**Example cURL:**
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{ "tool": "search_node_types", "args": { "query": "telegram" } }'
```

---

## 🏗️ Architecture

*   **Server:** Node.js with Express & MCP SDK.
*   **Transport:** Hybrid SSE (streaming) and HTTP (stateless).
*   **Structure:**
    *   `src/index.js`: Main entry point & transport logic.
    *   `src/n8nService.js`: API wrapper for n8n interactions.
    *   `src/tools/`: Modular tool definitions.

---

Made with ❤️ by the **Florian & Bob** Team.
