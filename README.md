# n8n-mcp-server

Servidor MCP en TypeScript para instalar y gestionar [n8n](https://n8n.io) desde cualquier cliente MCP (Claude Desktop, Claude Code, Cursor, VS Code…). Transporte stdio, sin dependencias más allá del [SDK oficial de MCP](https://github.com/modelcontextprotocol/typescript-sdk).

## Tools

### Gestión de proceso

| Tool | Qué hace |
|---|---|
| `n8n_install` | Instala n8n globalmente (`npm install -g n8n`) |
| `n8n_start` | Arranca n8n en background y espera a que responda en `http://localhost:5678` |
| `n8n_stop` | Detiene el proceso arrancado por `n8n_start` |
| `n8n_status` | Estado del proceso n8n |

### API de n8n

| Tool | Qué hace |
|---|---|
| `listWorkflows` | Lista los workflows |
| `getWorkflow` | Lee un workflow por id |
| `createWorkflow` | Crea un workflow |
| `activateWorkflow` / `deactivateWorkflow` | Activa / desactiva un workflow |
| `listExecutions` | Lista ejecuciones |
| `getExecution` | Lee una ejecución por id |

## Instalación

### Vía npx (recomendada)

Configuración del cliente MCP (p. ej. Claude Desktop, `~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "n8n-manager": {
      "command": "npx",
      "args": ["-y", "@hifede1/n8n-mcp-server"]
    }
  }
}
```

### Local (desde el código)

```bash
git clone https://github.com/hifede1/n8n-mcp-server.git
cd n8n-mcp-server
npm install
npm run build
```

```json
{
  "mcpServers": {
    "n8n-manager": {
      "command": "node",
      "args": ["/ruta/absoluta/a/n8n-mcp-server/build/index.js"]
    }
  }
}
```

## Estructura

```
src/
├── index.ts          # servidor y definición de tools
├── tools/
│   ├── install.ts    # gestión de proceso (install/start/stop/status)
│   └── api.ts        # tools contra la API REST de n8n
└── utils/
    └── n8nClient.ts  # cliente HTTP hacia localhost:5678
```

## Desarrollo

```bash
npm run dev    # tsc --watch
npm start      # node build/index.js
```

## Licencia

MIT
