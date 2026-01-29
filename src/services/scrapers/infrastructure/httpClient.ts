import { USER_AGENT } from "../constants";

export interface HttpResponse {
  ok: boolean;
  status: number;
  text: string;
  headers: Headers;
}

export async function httpGet(
  url: string,
  options?: {
    headers?: Record<string, string>;
    timeoutMs?: number;
  }
): Promise<HttpResponse> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      ...options?.headers,
    },
    signal: AbortSignal.timeout(options?.timeoutMs ?? 30000),
  });

  const text = await response.text();

  return {
    ok: response.ok,
    status: response.status,
    text,
    headers: response.headers,
  };
}

export async function httpGetJson<T>(
  url: string,
  options?: {
    headers?: Record<string, string>;
    timeoutMs?: number;
  }
): Promise<T> {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      "User-Agent": USER_AGENT,
      Accept: "application/json",
      ...options?.headers,
    },
    signal: AbortSignal.timeout(options?.timeoutMs ?? 30000),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }

  return response.json() as Promise<T>;
}
