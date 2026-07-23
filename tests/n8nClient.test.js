import { test } from "node:test";
import assert from "node:assert/strict";
import { n8nRequest } from "../build/utils/n8nClient.js";

const jsonResponse = (body) => ({
  ok: true,
  headers: { get: () => "application/json" },
  json: async () => body,
  text: async () => JSON.stringify(body),
});

test("N3_C1: arma la URL con el baseUrl por defecto y manda la API key en el header", async () => {
  let captured;
  globalThis.fetch = async (url, opts) => {
    captured = { url, opts };
    return jsonResponse({ data: [] });
  };
  await n8nRequest({ method: "GET", path: "/workflows", apiKey: "k-123" });
  assert.equal(captured.url, "http://localhost:5678/api/v1/workflows");
  assert.equal(captured.opts.headers["X-N8N-API-KEY"], "k-123");
  assert.equal(captured.opts.method, "GET");
  assert.equal(captured.opts.body, undefined);
});

test("N3_C1: respeta un baseUrl custom y serializa el body como JSON", async () => {
  let captured;
  globalThis.fetch = async (url, opts) => {
    captured = { url, opts };
    return jsonResponse({ id: "w1" });
  };
  await n8nRequest({
    method: "POST",
    path: "/workflows",
    apiKey: "k",
    baseUrl: "http://otra:9999/api/v1",
    body: { name: "wf" },
  });
  assert.equal(captured.url, "http://otra:9999/api/v1/workflows");
  assert.equal(captured.opts.body, JSON.stringify({ name: "wf" }));
});

test("N3_C2: un HTTP no-ok lanza error con status y cuerpo (la rama del 401)", async () => {
  globalThis.fetch = async () => ({
    ok: false,
    status: 401,
    text: async () => "unauthorized",
  });
  await assert.rejects(
    () => n8nRequest({ method: "GET", path: "/workflows", apiKey: "mala" }),
    (err) => {
      assert.match(err.message, /n8n API error 401/);
      assert.match(err.message, /unauthorized/);
      return true;
    }
  );
});

test("N3_C2: n8n caído (fetch rechaza) propaga el error, no lo traga", async () => {
  globalThis.fetch = async () => {
    throw new TypeError("fetch failed");
  };
  await assert.rejects(
    () => n8nRequest({ method: "GET", path: "/workflows", apiKey: "k" }),
    TypeError
  );
});

test("N3_C1: respuesta no-JSON cae al texto plano", async () => {
  globalThis.fetch = async () => ({
    ok: true,
    headers: { get: () => "text/plain" },
    json: async () => {
      throw new Error("no debería parsear JSON");
    },
    text: async () => "ok",
  });
  const out = await n8nRequest({ method: "GET", path: "/ping", apiKey: "k" });
  assert.equal(out, "ok");
});
