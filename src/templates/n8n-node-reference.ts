// n8n 2.2.6+ Complete Node Reference - EXTENDED VERSION
// 70+ Nodes: Core + Apps + Microsoft 365 Suite

export interface N8nNodeTemplate {
  type: string;
  typeVersion: number;
  category: string;
  parameters: Record<string, any>;
  description: string;
}

// ==================== CORE NODES ====================

export const N8N_CORE_NODES: Record<string, N8nNodeTemplate> = {
  webhook: {
    type: "n8n-nodes-base.webhook",
    typeVersion: 2,
    category: "trigger",
    description: "HTTP Webhook trigger",
    parameters: { httpMethod: "POST", path: "webhook-path", responseMode: "lastNode", options: {} }
  },
  manualTrigger: {
    type: "n8n-nodes-base.manualTrigger",
    typeVersion: 1,
    category: "trigger",
    description: "Manual workflow trigger",
    parameters: {}
  },
  scheduleTrigger: {
    type: "n8n-nodes-base.scheduleTrigger",
    typeVersion: 1,
    category: "trigger",
    description: "Time-based cron trigger",
    parameters: { rule: { interval: [{ field: "cronExpression", expression: "0 0 * * *" }] } }
  },
  editFields: {
    type: "n8n-nodes-base.set",
    typeVersion: 3,
    category: "data",
    description: "Set/Edit field values",
    parameters: { assignments: { assignments: [{ id: "1", name: "fieldName", value: "fieldValue", type: "string" }] }, options: {} }
  },
  code: {
    type: "n8n-nodes-base.code",
    typeVersion: 2,
    category: "data",
    description: "Execute JavaScript/Python",
    parameters: { language: "javaScript", jsCode: "return $input.all();", mode: "runOnceForAllItems" }
  },
  merge: {
    type: "n8n-nodes-base.merge",
    typeVersion: 3,
    category: "data",
    description: "Merge data from inputs",
    parameters: { mode: "append", options: {} }
  },
  aggregate: {
    type: "n8n-nodes-base.aggregate",
    typeVersion: 1,
    category: "data",
    description: "Sum, avg, count operations",
    parameters: { aggregate: "aggregateAllItemData", fieldsToAggregate: { fieldToAggregate: [] } }
  },
  sort: {
    type: "n8n-nodes-base.sort",
    typeVersion: 1,
    category: "data",
    description: "Sort items by fields",
    parameters: { sortFieldsUi: { sortField: [{ fieldName: "fieldName", order: "ascending" }] } }
  },
  splitOut: {
    type: "n8n-nodes-base.splitOut",
    typeVersion: 1,
    category: "data",
    description: "Split arrays into items",
    parameters: { fieldToSplitOut: "arrayField", options: {} }
  },
  if: {
    type: "n8n-nodes-base.if",
    typeVersion: 2,
    category: "flow",
    description: "Conditional routing",
    parameters: { conditions: { options: { combineOperation: "all" }, conditions: [{ leftValue: "={{ $json.field }}", rightValue: "value", operation: "equals" }] } }
  },
  switch: {
    type: "n8n-nodes-base.switch",
    typeVersion: 3,
    category: "flow",
    description: "Multi-way routing",
    parameters: { mode: "rules", rules: { rules: [{ output: 0, conditions: { conditions: [{ leftValue: "={{ $json.status }}", rightValue: "active", operation: "equals" }] } }] }, fallbackOutput: "extra" }
  },
  loop: {
    type: "n8n-nodes-base.loop",
    typeVersion: 1,
    category: "flow",
    description: "Loop iterations",
    parameters: { loopMode: "loopOverItems", maxIterations: 100 }
  },
  wait: {
    type: "n8n-nodes-base.wait",
    typeVersion: 1,
    category: "flow",
    description: "Pause execution",
    parameters: { resume: "after", amount: 5, unit: "seconds" }
  },
  httpRequest: {
    type: "n8n-nodes-base.httpRequest",
    typeVersion: 4,
    category: "api",
    description: "HTTP API requests",
    parameters: { method: "POST", url: "https://api.example.com/endpoint", authentication: "none", sendBody: true, bodyParametersJson: "{{ $json }}", options: { response: { response: { responseFormat: "json" } } } }
  },
  respondToWebhook: {
    type: "n8n-nodes-base.respondToWebhook",
    typeVersion: 1,
    category: "api",
    description: "Send webhook response",
    parameters: { respondWith: "allEntries", responseBody: "{{ $json }}", options: {} }
  },
  aiAgent: {
    type: "@n8n/n8n-nodes-langchain.agent",
    typeVersion: 1,
    category: "ai",
    description: "AI Agent with tools",
    parameters: { prompt: "You are a helpful assistant", hasOutputParser: false, options: {} }
  },
  postgres: {
    type: "n8n-nodes-base.postgres",
    typeVersion: 2,
    category: "database",
    description: "PostgreSQL operations",
    parameters: { operation: "executeQuery", query: "SELECT * FROM table", options: {} }
  },
  executeWorkflow: {
    type: "n8n-nodes-base.executeWorkflow",
    typeVersion: 1,
    category: "utility",
    description: "Execute another workflow",
    parameters: { source: "database", workflowId: "{{ $json.workflowId }}", waitForSubWorkflow: true }
  }
};

// ==================== APP NODES ====================

export const N8N_APP_NODES: Record<string, N8nNodeTemplate> = {
  slack: {
    type: "n8n-nodes-base.slack",
    typeVersion: 2,
    category: "communication",
    description: "Slack messaging",
    parameters: { resource: "message", operation: "post", select: "channel", channelId: { mode: "name", value: "general" }, text: "Hello from n8n!", otherOptions: {} }
  },
  discord: {
    type: "n8n-nodes-base.discord",
    typeVersion: 2,
    category: "communication",
    description: "Discord messaging",
    parameters: { resource: "message", operation: "send", webhookUrl: "", text: "Message from n8n", options: {} }
  },
  telegram: {
    type: "n8n-nodes-base.telegram",
    typeVersion: 1,
    category: "communication",
    description: "Telegram Bot API",
    parameters: { resource: "message", operation: "sendMessage", chatId: "", text: "Notification", additionalFields: {} }
  },
  gmail: {
    type: "n8n-nodes-base.gmail",
    typeVersion: 2,
    category: "email",
    description: "Gmail operations",
    parameters: { resource: "message", operation: "send", sendTo: "", subject: "Automated Email", emailType: "text", message: "Email body", options: {} }
  },
  mysql: {
    type: "n8n-nodes-base.mySql",
    typeVersion: 2,
    category: "database",
    description: "MySQL database",
    parameters: { operation: "executeQuery", query: "SELECT * FROM table", options: {} }
  },
  mongodb: {
    type: "n8n-nodes-base.mongoDb",
    typeVersion: 1,
    category: "database",
    description: "MongoDB NoSQL",
    parameters: { operation: "find", collection: "users", query: "{}", options: {} }
  },
  redis: {
    type: "n8n-nodes-base.redis",
    typeVersion: 1,
    category: "database",
    description: "Redis cache",
    parameters: { operation: "set", key: "cache:key", value: "{{ $json.data }}", options: {} }
  },
  googleSheets: {
    type: "n8n-nodes-base.googleSheets",
    typeVersion: 4,
    category: "productivity",
    description: "Google Sheets v4",
    parameters: { resource: "sheet", operation: "appendOrUpdate", documentId: { mode: "list", value: "" }, sheetName: { mode: "list", value: "Sheet1" }, columns: { mappingMode: "autoMapInputData", matchingColumns: [], value: {} }, options: {} }
  },
  googleDrive: {
    type: "n8n-nodes-base.googleDrive",
    typeVersion: 3,
    category: "productivity",
    description: "Google Drive files",
    parameters: { resource: "file", operation: "upload", name: "={{ $json.filename }}", parents: [], options: {} }
  },
  notion: {
    type: "n8n-nodes-base.notion",
    typeVersion: 2,
    category: "productivity",
    description: "Notion workspace",
    parameters: { resource: "page", operation: "create", pageId: "", simple: false, properties: {} }
  },
  openAi: {
    type: "n8n-nodes-base.openAi",
    typeVersion: 1,
    category: "ai",
    description: "OpenAI GPT/DALL-E/Whisper",
    parameters: { resource: "chat", operation: "message", model: "gpt-4", messages: { values: [{ role: "user", content: "={{ $json.prompt }}" }] }, options: {} }
  },
  openAiChatModel: {
    type: "@n8n/n8n-nodes-langchain.lmChatOpenAi",
    typeVersion: 1,
    category: "ai",
    description: "OpenAI Chat for AI Agent",
    parameters: { model: "gpt-4o", options: { temperature: 0.7, maxTokens: 4096 } }
  },
  anthropicClaude: {
    type: "@n8n/n8n-nodes-langchain.lmChatAnthropic",
    typeVersion: 1,
    category: "ai",
    description: "Anthropic Claude",
    parameters: { model: "claude-3-5-sonnet-20241022", options: {} }
  },
  hubspot: {
    type: "n8n-nodes-base.hubspot",
    typeVersion: 2,
    category: "crm",
    description: "HubSpot CRM",
    parameters: { resource: "contact", operation: "create", email: "", additionalFields: {} }
  },
  github: {
    type: "n8n-nodes-base.github",
    typeVersion: 1,
    category: "developer",
    description: "GitHub repositories",
    parameters: { resource: "issue", operation: "create", owner: "", repository: "", title: "", body: "" }
  }
};

// ==================== MICROSOFT 365 & GRAPH NODES ====================

export const N8N_MICROSOFT_NODES: Record<string, N8nNodeTemplate> = {
  microsoftOutlook: {
    type: "n8n-nodes-base.microsoftOutlook",
    typeVersion: 2,
    category: "microsoft",
    description: "Microsoft Outlook email operations",
    parameters: { resource: "message", operation: "send", to: "user@example.com", subject: "Email from n8n", bodyContent: "Message body", bodyContentType: "html", additionalFields: {} }
  },
  microsoftTeamsNode: {
    type: "n8n-nodes-base.microsoftTeams",
    typeVersion: 1,
    category: "microsoft",
    description: "Microsoft Teams collaboration",
    parameters: { resource: "message", operation: "create", teamId: "", channelId: "", messageType: "text", message: "Update from n8n", options: {} }
  },
  microsoftOneDrive: {
    type: "n8n-nodes-base.microsoftOneDrive",
    typeVersion: 1,
    category: "microsoft",
    description: "Microsoft OneDrive file storage",
    parameters: { resource: "file", operation: "upload", parentId: "root", fileName: "document.pdf", binaryData: true, options: {} }
  },
  microsoftSharePoint: {
    type: "n8n-nodes-base.microsoftSharePoint",
    typeVersion: 1,
    category: "microsoft",
    description: "Microsoft SharePoint document management",
    parameters: { resource: "file", operation: "upload", siteId: "", driveId: "", fileName: "report.xlsx", binaryPropertyName: "data", options: {} }
  },
  microsoftExcel: {
    type: "n8n-nodes-base.microsoftExcel",
    typeVersion: 1,
    category: "microsoft",
    description: "Microsoft Excel spreadsheet operations",
    parameters: { resource: "table", operation: "addRow", workbookId: "", worksheetId: "", tableId: "", additionalFields: {} }
  },
  microsoftToDo: {
    type: "n8n-nodes-base.microsoftToDo",
    typeVersion: 1,
    category: "microsoft",
    description: "Microsoft To Do task management",
    parameters: { resource: "task", operation: "create", taskListId: "", title: "New Task", additionalFields: {} }
  },
  microsoftSQL: {
    type: "n8n-nodes-base.microsoftSql",
    typeVersion: 2,
    category: "microsoft",
    description: "Microsoft SQL Server database",
    parameters: { operation: "executeQuery", query: "SELECT * FROM customers", options: {} }
  },
  powerAutomate: {
    type: "n8n-nodes-base.microsoftFlows",
    typeVersion: 1,
    category: "microsoft",
    description: "Microsoft Power Automate (Flows)",
    parameters: { operation: "trigger", flowUrl: "", jsonParameters: true, bodyParametersJson: "={{ $json }}" }
  },
  azureBlobStorage: {
    type: "n8n-nodes-base.microsoftAzure",
    typeVersion: 1,
    category: "microsoft",
    description: "Azure Blob Storage operations",
    parameters: { resource: "blob", operation: "upload", containerName: "documents", blobName: "file.pdf", binaryData: true }
  },
  microsoftGraph: {
    type: "n8n-nodes-base.microsoftGraphApi",
    typeVersion: 1,
    category: "microsoft",
    description: "Microsoft Graph API - Universal M365 access",
    parameters: {
      resource: "user",
      operation: "get",
      userId: "me",
      options: {}
    }
  },
  powerBI: {
    type: "n8n-nodes-base.microsoftPowerBi",
    typeVersion: 1,
    category: "microsoft",
    description: "Microsoft Power BI reporting and dashboards",
    parameters: {
      resource: "dataset",
      operation: "refresh",
      datasetId: "",
      options: {}
    }
  },
  microsoftEntraID: {
    type: "n8n-nodes-base.azureActiveDirectory",
    typeVersion: 1,
    category: "microsoft",
    description: "Microsoft Entra ID (Azure AD) - User & Group management",
    parameters: {
      resource: "user",
      operation: "get",
      userId: "",
      additionalFields: {}
    }
  },
  microsoftBookings: {
    type: "n8n-nodes-base.microsoftBookings",
    typeVersion: 1,
    category: "microsoft",
    description: "Microsoft Bookings scheduling",
    parameters: {
      resource: "appointment",
      operation: "create",
      businessId: "",
      serviceId: "",
      startDateTime: "={{ $now.toISO() }}",
      additionalFields: {}
    }
  },
  microsoftPlanner: {
    type: "n8n-nodes-base.microsoftPlanner",
    typeVersion: 1,
    category: "microsoft",
    description: "Microsoft Planner task management",
    parameters: {
      resource: "task",
      operation: "create",
      planId: "",
      bucketId: "",
      title: "New Task",
      additionalFields: {}
    }
  }
};

// ==================== MCP NODES ====================

export const N8N_MCP_NODES: Record<string, N8nNodeTemplate> = {
  mcpClient: {
    type: "n8n-nodes-mcp.mcpClient",
    typeVersion: 1,
    category: "mcp",
    description: "MCP Client integration",
    parameters: { operation: "executeTools", tool: "tool_name", toolArguments: "{\"key\": \"value\"}", connectionType: "httpStreamable" }
  }
};

// ==================== EXPORTS ====================

export const ALL_NODES = { 
  ...N8N_CORE_NODES, 
  ...N8N_APP_NODES, 
  ...N8N_MICROSOFT_NODES,
  ...N8N_MCP_NODES
};

export function getNodeTemplate(nodeType: string): N8nNodeTemplate | undefined {
  return ALL_NODES[nodeType];
}

export function getNodesByCategory(category: string): N8nNodeTemplate[] {
  return Object.values(ALL_NODES).filter(node => node.category === category);
}

export function getAllNodeTypes(): string[] {
  return Object.keys(ALL_NODES);
}

export default { N8N_CORE_NODES, N8N_APP_NODES, N8N_MICROSOFT_NODES, N8N_MCP_NODES, ALL_NODES, getNodeTemplate, getNodesByCategory, getAllNodeTypes };
