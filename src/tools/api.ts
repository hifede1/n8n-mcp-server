import { n8nRequest } from "../utils/n8nClient.js";

interface ApiParams {
  apiKey: string;
  baseUrl?: string;
}

// Workflows

export async function listWorkflows(params: ApiParams) {
  return n8nRequest({
    method: "GET",
    path: "/workflows",
    apiKey: params.apiKey,
    baseUrl: params.baseUrl,
  });
}

export async function getWorkflow(params: ApiParams & { id: string }) {
  return n8nRequest({
    method: "GET",
    path: `/workflows/${params.id}`,
    apiKey: params.apiKey,
    baseUrl: params.baseUrl,
  });
}

export async function createWorkflow(
  params: ApiParams & { workflow: unknown }
) {
  return n8nRequest({
    method: "POST",
    path: "/workflows",
    apiKey: params.apiKey,
    baseUrl: params.baseUrl,
    body: params.workflow,
  });
}

export async function activateWorkflow(params: ApiParams & { id: string }) {
  return n8nRequest({
    method: "POST",
    path: `/workflows/${params.id}/activate`,
    apiKey: params.apiKey,
    baseUrl: params.baseUrl,
  });
}

export async function deactivateWorkflow(params: ApiParams & { id: string }) {
  return n8nRequest({
    method: "POST",
    path: `/workflows/${params.id}/deactivate`,
    apiKey: params.apiKey,
    baseUrl: params.baseUrl,
  });
}

// Executions

export async function listExecutions(
  params: ApiParams & { limit?: number; workflowId?: string }
) {
  const query = new URLSearchParams();
  if (params.limit) query.set("limit", String(params.limit));
  if (params.workflowId) query.set("workflowId", params.workflowId);
  const qs = query.toString();

  return n8nRequest({
    method: "GET",
    path: `/executions${qs ? `?${qs}` : ""}`,
    apiKey: params.apiKey,
    baseUrl: params.baseUrl,
  });
}

export async function getExecution(params: ApiParams & { id: string }) {
  return n8nRequest({
    method: "GET",
    path: `/executions/${params.id}`,
    apiKey: params.apiKey,
    baseUrl: params.baseUrl,
  });
}
