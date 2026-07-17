import { exec, spawn } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

let n8nPid: number | null = null;

export async function n8nInstall(): Promise<string> {
  try {
    const { stdout, stderr } = await execAsync("npm install -g n8n", {
      timeout: 300_000, // 5 minutes
    });
    return `n8n instalado correctamente.\n${stdout}${stderr ? `\nWarnings: ${stderr}` : ""}`;
  } catch (err) {
    const error = err as Error & { stdout?: string; stderr?: string };
    throw new Error(
      `Error instalando n8n: ${error.message}\n${error.stderr ?? ""}`
    );
  }
}

export async function n8nStart(): Promise<string> {
  if (n8nPid !== null) {
    return `n8n ya está corriendo con PID ${n8nPid} en http://localhost:5678`;
  }

  const child = spawn("n8n", ["start"], {
    detached: true,
    stdio: "ignore",
    shell: true,
  });

  child.unref();

  if (child.pid === undefined) {
    throw new Error("No se pudo obtener el PID del proceso n8n.");
  }

  n8nPid = child.pid;

  // Wait up to 30 seconds for n8n to be ready
  const ready = await waitForN8n(30_000);
  if (!ready) {
    n8nPid = null;
    throw new Error(
      "n8n no respondió en 30 segundos. Verifica que el puerto 5678 esté libre."
    );
  }

  return `n8n iniciado con PID ${n8nPid}. Disponible en http://localhost:5678`;
}

export async function n8nStop(): Promise<string> {
  if (n8nPid === null) {
    return "n8n no está corriendo (no hay PID registrado).";
  }

  try {
    process.kill(n8nPid, "SIGTERM");
    const pid = n8nPid;
    n8nPid = null;
    return `n8n detenido (PID ${pid}).`;
  } catch (err) {
    const error = err as NodeJS.ErrnoException;
    n8nPid = null;
    if (error.code === "ESRCH") {
      return "El proceso n8n ya no existía.";
    }
    throw new Error(`Error deteniendo n8n: ${error.message}`);
  }
}

export async function n8nStatus(): Promise<string> {
  try {
    const response = await fetch("http://localhost:5678", {
      signal: AbortSignal.timeout(3000),
    });
    const statusText = response.ok ? "UP" : `respondió con ${response.status}`;
    const pidInfo = n8nPid ? ` (PID ${n8nPid})` : "";
    return `n8n está corriendo${pidInfo}: http://localhost:5678 — ${statusText}`;
  } catch {
    return `n8n NO está corriendo en http://localhost:5678.${n8nPid ? ` (PID ${n8nPid} registrado pero no responde)` : ""}`;
  }
}

async function waitForN8n(timeoutMs: number): Promise<boolean> {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      await fetch("http://localhost:5678", {
        signal: AbortSignal.timeout(2000),
      });
      return true;
    } catch {
      await sleep(2000);
    }
  }
  return false;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
