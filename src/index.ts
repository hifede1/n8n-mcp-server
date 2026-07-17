#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

import {
  n8nInstall,
  n8nStart,
  n8nStop,
  n8nStatus,
} from "./tools/install.js";

import {
  listWorkflows,
  getWorkflow,
  createWorkflow,
  activateWorkflow,
  deactivateWorkflow,
  listExecutions,
  getExecution,
} from "./tools/api.js";

// ────────────────────────────────────────────────────────────
// Server definition
// ────────────────────────────────────────────────────────────

const server = new Server(
  { name: "n8n-manager", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

// ────────────────────────────────────────────────────────────
// Tool definitions
// ────────────────────────────────────────────────────────────

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    // ── Process management ──────────────────────────────────
    {
      name: "n8n_install",
      description:
        "Instala n8n globalmente en la máquina usando npm install -g n8n.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "n8n_start",
      description:
        "Inicia n8n en background. Espera hasta que responda en http://localhost:5678.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "n8n_stop",
      description: "Detiene el proceso de n8n iniciado por n8n_start.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },
    {
      name: "n8n_status",
      description:
        "Verifica si n8n está corriendo y accesible en http://localhost:5678.",
      inputSchema: { type: "object", properties: {}, required: [] },
    },

    // ── Workflows ───────────────────────────────────────────
    {
      name: "n8n_list_workflows",
      description: "Lista todos los workflows de n8n.",
      inputSchema: {
        type: "object",
        properties: {
          api_key: {
            type: "string",
            description: "API key de n8n (Settings > n8n API).",
          },
          base_url: {
            type: "string",
            description:
              "URL base de la API (default: http://localhost:5678/api/v1).",
          },
        },
        required: ["api_key"],
      },
    },
    {
      name: "n8n_get_workflow",
      description: "Obtiene el detalle de un workflow por su ID.",
      inputSchema: {
        type: "object",
        properties: {
          api_key: { type: "string", description: "API key de n8n." },
          id: { type: "string", description: "ID del workflow." },
          base_url: { type: "string" },
        },
        required: ["api_key", "id"],
      },
    },
    {
      name: "n8n_create_workflow",
      description: "Crea un nuevo workflow en n8n.",
      inputSchema: {
        type: "object",
        properties: {
          api_key: { type: "string", description: "API key de n8n." },
          workflow: {
            type: "object",
            description:
              "Objeto del workflow según el esquema de n8n (name, nodes, connections, settings).",
          },
          base_url: { type: "string" },
        },
        required: ["api_key", "workflow"],
      },
    },
    {
      name: "n8n_activate_workflow",
      description: "Activa un workflow por su ID.",
      inputSchema: {
        type: "object",
        properties: {
          api_key: { type: "string", description: "API key de n8n." },
          id: { type: "string", description: "ID del workflow." },
          base_url: { type: "string" },
        },
        required: ["api_key", "id"],
      },
    },
    {
      name: "n8n_deactivate_workflow",
      description: "Desactiva un workflow por su ID.",
      inputSchema: {
        type: "object",
        properties: {
          api_key: { type: "string", description: "API key de n8n." },
          id: { type: "string", description: "ID del workflow." },
          base_url: { type: "string" },
        },
        required: ["api_key", "id"],
      },
    },

    // ── Executions ──────────────────────────────────────────
    {
      name: "n8n_list_executions",
      description: "Lista las ejecuciones recientes de n8n.",
      inputSchema: {
        type: "object",
        properties: {
          api_key: { type: "string", description: "API key de n8n." },
          limit: {
            type: "number",
            description: "Número máximo de ejecuciones a devolver.",
          },
          workflow_id: {
            type: "string",
            description: "Filtrar por ID de workflow.",
          },
          base_url: { type: "string" },
        },
        required: ["api_key"],
      },
    },
    {
      name: "n8n_get_execution",
      description: "Obtiene el detalle de una ejecución por su ID.",
      inputSchema: {
        type: "object",
        properties: {
          api_key: { type: "string", description: "API key de n8n." },
          id: { type: "string", description: "ID de la ejecución." },
          base_url: { type: "string" },
        },
        required: ["api_key", "id"],
      },
    },
  ],
}));

// ────────────────────────────────────────────────────────────
// Tool execution
// ────────────────────────────────────────────────────────────

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const a = (args ?? {}) as Record<string, unknown>;

  try {
    let result: unknown;

    switch (name) {
      // Process
      case "n8n_install":
        result = await n8nInstall();
        break;
      case "n8n_start":
        result = await n8nStart();
        break;
      case "n8n_stop":
        result = await n8nStop();
        break;
      case "n8n_status":
        result = await n8nStatus();
        break;

      // Workflows
      case "n8n_list_workflows":
        result = await listWorkflows({
          apiKey: a.api_key as string,
          baseUrl: a.base_url as string | undefined,
        });
        break;
      case "n8n_get_workflow":
        result = await getWorkflow({
          apiKey: a.api_key as string,
          id: a.id as string,
          baseUrl: a.base_url as string | undefined,
        });
        break;
      case "n8n_create_workflow":
        result = await createWorkflow({
          apiKey: a.api_key as string,
          workflow: a.workflow,
          baseUrl: a.base_url as string | undefined,
        });
        break;
      case "n8n_activate_workflow":
        result = await activateWorkflow({
          apiKey: a.api_key as string,
          id: a.id as string,
          baseUrl: a.base_url as string | undefined,
        });
        break;
      case "n8n_deactivate_workflow":
        result = await deactivateWorkflow({
          apiKey: a.api_key as string,
          id: a.id as string,
          baseUrl: a.base_url as string | undefined,
        });
        break;

      // Executions
      case "n8n_list_executions":
        result = await listExecutions({
          apiKey: a.api_key as string,
          limit: a.limit as number | undefined,
          workflowId: a.workflow_id as string | undefined,
          baseUrl: a.base_url as string | undefined,
        });
        break;
      case "n8n_get_execution":
        result = await getExecution({
          apiKey: a.api_key as string,
          id: a.id as string,
          baseUrl: a.base_url as string | undefined,
        });
        break;

      default:
        throw new Error(`Tool desconocida: ${name}`);
    }

    const text =
      typeof result === "string" ? result : JSON.stringify(result, null, 2);

    return { content: [{ type: "text", text }] };
  } catch (err) {
    const error = err as Error;
    return {
      content: [{ type: "text", text: `Error: ${error.message}` }],
      isError: true,
    };
  }
});

// ────────────────────────────────────────────────────────────
// Start
// ────────────────────────────────────────────────────────────

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("n8n MCP Server corriendo en stdio");
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
