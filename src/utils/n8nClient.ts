export interface N8nRequestOptions {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  path: string;
  apiKey: string;
  baseUrl?: string;
  body?: unknown;
}

export async function n8nRequest<T = unknown>(
  options: N8nRequestOptions
): Promise<T> {
  const { method, path, apiKey, body } = options;
  const baseUrl = options.baseUrl ?? "http://localhost:5678/api/v1";
  const url = `${baseUrl}${path}`;

  const headers: Record<string, string> = {
    "X-N8N-API-KEY": apiKey,
    "Content-Type": "application/json",
    Accept: "application/json",
  };

  const fetchOptions: RequestInit = {
    method,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  };

  const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`n8n API error ${response.status}: ${text}`);
  }

  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as T;
  }

  return (await response.text()) as unknown as T;
}
