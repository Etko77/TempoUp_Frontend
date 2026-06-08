import Constants from 'expo-constants';
import { tokenStorage } from '@/auth/secureStore';
import type { ApiErrorResponse, AuthResponse } from '@/types/api';

const extra = (Constants.expoConfig?.extra ?? {}) as {
  apiBaseUrl?: string;
  wsBaseUrl?: string;
};

export const API_BASE_URL = extra.apiBaseUrl ?? 'http://10.0.2.2:8080';
export const WS_BASE_URL = extra.wsBaseUrl ?? 'ws://10.0.2.2:8080';

/** Thrown for any non-2xx response. */
export class ApiError extends Error {
  status: number;
  body?: ApiErrorResponse;
  constructor(status: number, message: string, body?: ApiErrorResponse) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Set true to skip the Authorization header (login/register/refresh). */
  anonymous?: boolean;
  /** Internal flag used to prevent infinite refresh loops. */
  _retry?: boolean;
  query?: Record<string, string | number | boolean | undefined | null>;
}

/**
 * A single-flight refresh promise. If many requests fire 401 concurrently,
 * they all await the same refresh call rather than triggering multiple.
 */
let refreshInFlight: Promise<AuthResponse> | null = null;

/** Callback invoked on unrecoverable auth failure (e.g. refresh expired). */
let onAuthFailureCallback: (() => void) | null = null;
export function setOnAuthFailure(cb: () => void) {
  onAuthFailureCallback = cb;
}

async function refreshTokens(): Promise<AuthResponse> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = (async () => {
    const refresh = await tokenStorage.getRefresh();
    if (!refresh) throw new ApiError(401, 'No refresh token');
    const res = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: refresh }),
    });
    if (!res.ok) throw new ApiError(res.status, 'Refresh failed');
    const data = (await res.json()) as AuthResponse;
    await tokenStorage.saveTokens(data.accessToken, data.refreshToken);
    await tokenStorage.saveUser({
      userId: data.userId,
      email: data.email,
      role: data.role,
    });
    return data;
  })();
  try {
    return await refreshInFlight;
  } finally {
    refreshInFlight = null;
  }
}

function buildUrl(path: string, query?: RequestOptions['query']): string {
  const url = new URL(`${API_BASE_URL}${path}`);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  return url.toString();
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = 'GET', body, anonymous = false, _retry = false, query } = opts;

  const headers: Record<string, string> = { Accept: 'application/json' };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (!anonymous) {
    const access = await tokenStorage.getAccess();
    if (access) headers.Authorization = `Bearer ${access}`;
  }

  const res = await fetch(buildUrl(path, query), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  // 401 -> attempt single refresh-and-retry
  if (res.status === 401 && !anonymous && !_retry) {
    try {
      await refreshTokens();
      return request<T>(path, { ...opts, _retry: true });
    } catch {
      await tokenStorage.clear();
      onAuthFailureCallback?.();
      throw new ApiError(401, 'Session expired');
    }
  }

  if (res.status === 204) return undefined as T;

  const text = await res.text();
  const data = text ? (JSON.parse(text) as unknown) : undefined;

  if (!res.ok) {
    const errBody = data as ApiErrorResponse | undefined;
    throw new ApiError(res.status, errBody?.message ?? `HTTP ${res.status}`, errBody);
  }
  return data as T;
}
