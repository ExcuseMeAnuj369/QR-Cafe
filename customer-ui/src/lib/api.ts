// Typed fetch layer over the FastAPI backend with offline/standalone mock fallback.
import { handleMockRequest } from "./mockApi";

const BASE = "/api";

// Fields are declared, not constructor parameter properties: tsconfig sets
// erasableSyntaxOnly, which rejects `constructor(readonly status: number)`.
export class ApiError extends Error {
  status: number;
  body: unknown;

  constructor(status: number, body: unknown) {
    super(`request failed with ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.body = body;
  }
}

type JsonBody = unknown;

async function request<T>(method: string, path: string, body?: JsonBody): Promise<T> {
  try {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });

    if (res.ok) {
      if (res.status === 204) return undefined as T;
      return (await res.json()) as T;
    }

    // If backend proxy returned 404, 502, 503, 504, or 500 (e.g. backend server not running), fallback to mock
    if (res.status === 404 || res.status === 502 || res.status === 503 || res.status === 504 || res.status === 500) {
      return handleMockRequest<T>(method, path, body);
    }

    const errBody = await res.json().catch(() => null);
    throw new ApiError(res.status, errBody);
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // Network error / connection refused / offline dev mode -> seamless mock fallback
    return handleMockRequest<T>(method, path, body);
  }
}

// The response type is yours to declare: nothing infers across the Python boundary, so a
// TS interface here mirrors the endpoint's Pydantic model by hand — keep the two in sync.
export const apiGet = <T>(path: string) => request<T>("GET", path);
export const apiPost = <T>(path: string, body?: JsonBody) => request<T>("POST", path, body ?? null);
export const apiPut = <T>(path: string, body?: JsonBody) => request<T>("PUT", path, body ?? null);
export const apiPatch = <T>(path: string, body?: JsonBody) =>
  request<T>("PATCH", path, body ?? null);
export const apiDelete = <T>(path: string) => request<T>("DELETE", path);
