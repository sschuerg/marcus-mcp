# MARCUS MCP Server - Deployment Guide & Fix Report

**Date:** 2026-01-06
**Fix:** MCP Tool Response Format (Error -32602)

---

## 🚨 Problem Summary
The MARCUS MCP Server was returning raw Arrays/Objects from tool calls (e.g., `[{ id: 1 }]`).
The MCP SDK strictly requires a structured object:
```json
{
  "content": [
    {
      "type": "text",
      "text": "JSON_STRING_HERE"
    }
  ],
  "isError": false
}
```
This caused **FLORIAN** (SSE Client) to fail with `MCP error -32602`.

## ✅ Solution Implemented
1.  **Refactored Tools:** All files in `src/tools/` now wrap their output in the standard `formatResponse()` or `formatError()` helpers.
2.  **Dual-Mode Compatibility:** Updated `src/index.js` to detect MCP objects in the `/webhook` endpoint and **unwrap** them back to plain JSON for **BOB** (HTTP Client).
3.  **Error Handling:** Added try/catch blocks to all tools to return graceful MCP error responses instead of crashing the server.

---

## 📦 Deployment Checklist

### 1. Update Codebase
Since you are using the mapped volume `marcus-mcp/src`, the code changes are already applied on the host.

### 2. Restart Container
To ensure the node process reloads the new files (and to be safe):
```bash
./scripts/manage-stack.sh restart marcus-mcp
```

### 3. Verification
Run the included test script to verify internal structure:
```bash
cd marcus-mcp
npm install  # Only needed once
node test-tools.js
```
*Expected Output:* `🎉 ALL FORMAT TESTS PASSED`

### 4. Rollback Plan
If something breaks critically:
1.  Revert the git changes in `marcus-mcp/`.
    ```bash
    cd marcus-mcp
    git reset --hard HEAD~1
    ```
2.  Restart the container:
    ```bash
    ../scripts/manage-stack.sh restart marcus-mcp
    ```

---

## 🧪 Testing the Agents

### Test FLORIAN (SSE)
1.  Open n8n.
2.  Open the **FLORIAN** workflow.
3.  Manually trigger the chat with: "Liste alle Workflows auf".
4.  **Success Criteria:** The agent should now execute the tool `list_workflows` *without* the `Invalid tools/call result` error and provide a text response.

### Test BOB (Webhook)
1.  Open the **BOB** workflow.
2.  Check the execution logs or trigger a test run.
3.  **Success Criteria:** The HTTP Request node to `https://mcp.inri-consulting.de/webhook` should succeed and return a standard JSON array/object (NOT the nested `content` object).

---

## 🔧 Environment Variables
No new variables are required. Ensure your `.env` contains:
*   `N8N_API_BASE_URL` (Internal Docker URL: `http://n8n:5678/api/v1`)
*   `N8N_API_KEY`
*   `MCP_SERVER_NAME`

---

*Fix implemented by Gemini Agent (Senior Architect Mode)*
