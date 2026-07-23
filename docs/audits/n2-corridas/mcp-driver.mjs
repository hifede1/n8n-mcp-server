#!/usr/bin/env node
// Cliente MCP mínimo por stdio para el smoke N2 de n8n-mcp-server.
// Uso: node mcp-driver.mjs <server.js> <escenario>
// Escenarios: lifecycle | install | start-and-abandon | status-only | stop-only
import { spawn } from "node:child_process";

const [server, escenario] = process.argv.slice(2);
const child = spawn("node", [server], { stdio: ["pipe", "pipe", "pipe"] });
child.stderr.on("data", (d) => log(`[stderr] ${String(d).trim()}`));

let buf = "";
const pending = new Map();
child.stdout.on("data", (d) => {
  buf += d;
  let i;
  while ((i = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, i); buf = buf.slice(i + 1);
    if (!line.trim()) continue;
    try {
      const msg = JSON.parse(line);
      if (msg.id !== undefined && pending.has(msg.id)) {
        const { resolve } = pending.get(msg.id); pending.delete(msg.id); resolve(msg);
      }
    } catch { log(`[stdout no-json] ${line}`); }
  }
});

const ts = () => new Date().toISOString().slice(11, 19);
const log = (m) => console.log(`${ts()} ${m}`);
let nextId = 1;
const rpc = (method, params, timeoutMs = 60_000) => new Promise((resolve, reject) => {
  const id = nextId++;
  pending.set(id, { resolve });
  const t = setTimeout(() => { pending.delete(id); reject(new Error(`TIMEOUT ${timeoutMs}ms en ${method} id=${id}`)); }, timeoutMs);
  pending.get(id).resolve = (msg) => { clearTimeout(t); resolve(msg); };
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
});
const notify = (method) => child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method }) + "\n");

const tool = async (name, args = {}, timeoutMs = 60_000) => {
  log(`→ tools/call ${name}`);
  const t0 = Date.now();
  try {
    const r = await rpc("tools/call", { name, arguments: args }, timeoutMs);
    const text = r.result?.content?.map((c) => c.text).join(" ") ?? JSON.stringify(r.result ?? r.error);
    log(`← ${name} (${((Date.now() - t0) / 1000).toFixed(1)}s) isError=${r.result?.isError ?? false}: ${text.slice(0, 300).replace(/\n/g, " ⏎ ")}`);
    return { text, isError: r.result?.isError ?? false };
  } catch (e) {
    log(`← ${name} EXCEPCIÓN (${((Date.now() - t0) / 1000).toFixed(1)}s): ${e.message}`);
    return { text: e.message, isError: true, timeout: true };
  }
};

const init = await rpc("initialize", {
  protocolVersion: "2024-11-05", capabilities: {},
  clientInfo: { name: "n2-smoke", version: "1.0" },
});
notify("notifications/initialized");
log(`init OK: ${JSON.stringify(init.result?.serverInfo)}`);

if (escenario === "install") {
  await tool("n8n_install", {}, 480_000);
} else if (escenario === "lifecycle") {
  await tool("n8n_status");
  await tool("n8n_stop");                       // borde: stop sin start
  await tool("n8n_start", {}, 90_000);
  await tool("n8n_status");
  await tool("n8n_start", {}, 90_000);          // borde: doble start
  await tool("n8n_stop");
  await new Promise((r) => setTimeout(r, 2000));
  await tool("n8n_status");
} else if (escenario === "start-and-abandon") {
  await tool("n8n_start", {}, 90_000);
  await tool("n8n_status");
  log("ABANDONO: mato el server MCP dejando n8n vivo (el huérfano)");
} else if (escenario === "status-only") {
  await tool("n8n_status");
} else if (escenario === "stop-only") {
  await tool("n8n_stop");
} else {
  log(`escenario desconocido: ${escenario}`);
}

child.kill();
process.exit(0);
