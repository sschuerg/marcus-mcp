# MARCUS MCP Server

Der MARCUS MCP (Model Context Protocol) Server fungiert als intelligenter Tool-Hub für n8n und KI-Agenten. Er stellt Schnittstellen für n8n-Management, CRM-Daten (Optigem) und KI-Modelle bereit.

## Architektur
Der Server basiert auf Express.js und implementiert den MCP-Standard über zwei Endpunkte:
-   `/sse`: Standard-MCP Kommunikation für Agenten.
-   `/webhook`: Zustandslose HTTP-POST Schnittstelle für n8n-Nodes.

## Verfügbare Tools

### 1. n8n Management
-   `list_workflows`: Übersicht aller Workflows.
-   `get_workflow`: JSON-Definition abrufen.
-   `execute_workflow`: Workflows via API triggern.
-   `import_workflow`: Workflows migrieren und IDs bereinigen.

### 2. KI & Agent Deployment
-   `deploy_mcp_agent`: Installiert spezialisierte n8n-Agenten (z.B. `workflow_analyzer`).
-   `sync_n8n_credentials`: Synchronisiert API-Keys für OpenRouter und Optigem vom Host nach n8n.
-   `analyze_workflow_with_ai`: Nutzt Qwen-Coder zur Workflow-Analyse.

### 3. CRM Integration (Optigem)
-   `query_optigem_persons`: Sucht Personen im CRM.
-   `optigem_query`: Führt SQL-Abfragen direkt auf der Optigem-DB aus.

## Sicherheit
Alle Anfragen erfordern eine Authentifizierung via Bearer-Token:
`Authorization: Bearer <MCP_BEARER_TOKEN>`

## Credential Sync
Damit n8n-Workflows die KI-Modelle nutzen können, müssen die Credentials synchronisiert werden:
`curl -X POST http://localhost:3000/webhook -d '{"tool": "sync_n8n_credentials"}'`

*Hinweis: Der Sync erzeugt in n8n Credentials vom Typ `httpHeaderAuth` (z.B. Marcus-OpenRouter-Key).*