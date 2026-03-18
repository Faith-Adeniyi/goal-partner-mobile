/**
 * Network utilities for talking to the FastAPI backend.
 *
 * Source of truth for base URL:
 * - Prefer `expo.extra.apiBaseUrl` from `app.json` (works for physical devices too).
 * - Allow `.env` override via `EXPO_PUBLIC_API_BASE_URL` (useful for CI / local overrides).
 *
 * Note: Do NOT hard-require `.env` here; doing so can break networking when the app is
 * configured via `app.json` (as this project is).
 */

import Constants from "expo-constants";

type JsonRecord = Record<string, unknown>;

function normalizeBaseUrl(url: string): string {
  return url.trim().replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
  const envUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
  const appExtraUrl = (Constants as any)?.expoConfig?.extra?.apiBaseUrl;

  const raw =
    (typeof appExtraUrl === "string" && appExtraUrl.trim() ? appExtraUrl : null) ||
    (typeof envUrl === "string" && envUrl.trim() ? envUrl : null);

  if (!raw) {
    // Keep error explicit, but do not force `.env` specifically.
    const message =
      "[networkUtils] Missing API base URL. Set `expo.extra.apiBaseUrl` in app.json or `EXPO_PUBLIC_API_BASE_URL` in .env, then restart Expo.";
    console.error(message, { appExtraUrl, envUrl });
    throw new Error(message);
  }

  return normalizeBaseUrl(raw);
}

type JsonRequestInit = Omit<RequestInit, "body"> & { body?: unknown };

async function requestJson<TResponse>(
  path: string,
  init?: JsonRequestInit
): Promise<TResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}${path.startsWith("/") ? "" : "/"}${path}`;

  try {
    const res = await fetch(url, {
      method: init?.method ?? "GET",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
      body:
        init?.body === undefined
          ? undefined
          : typeof init.body === "string"
          ? init.body
          : JSON.stringify(init.body),
    });

    // Try to parse JSON response (even on errors) to surface FastAPI `detail`
    const text = await res.text();
    const data = text ? (JSON.parse(text) as unknown) : null;

    if (!res.ok) {
      const detail =
        (data as any)?.detail ||
        (data as any)?.message ||
        `HTTP ${res.status} ${res.statusText}`;
      console.error("[networkUtils] Request failed", {
        url,
        status: res.status,
        detail,
        response: data,
      });
      throw new Error(detail);
    }

    return data as TResponse;
  } catch (err) {
    console.error("[networkUtils] Network failure", {
      url,
      path,
      error: err,
    });
    throw err;
  }
}

/**
 * Pings the backend root endpoint (/) to verify connectivity.
 */
export async function checkBackendConnection(): Promise<JsonRecord> {
  try {
    return await requestJson<JsonRecord>("/", { method: "GET" });
  } catch (err) {
    console.error("[networkUtils] checkBackendConnection failed", err);
    throw err;
  }
}

/**
 * Sends a chat request to POST /chat.
 * Accepts a JSON payload (message, mode, goal_id, chat_history, etc.)
 */
export async function sendChatMessage<TResponse = JsonRecord>(
  payload: JsonRecord
): Promise<TResponse> {
  try {
    return await requestJson<TResponse>("/chat", {
      method: "POST",
      body: payload,
    });
  } catch (err) {
    console.error("[networkUtils] sendChatMessage failed", {
      payload,
      error: err,
    });
    throw err;
  }
}

/**
 * Sends a coaching request to POST /goals/${planId}/coach.
 * Accepts the plan ID and a JSON payload.
 */
export async function sendCoachMessage<TResponse = JsonRecord>(
  planId: string,
  payload: JsonRecord
): Promise<TResponse> {
  const safePlanId = (planId || "").trim();
  if (!safePlanId) {
    const message = "[networkUtils] sendCoachMessage requires a valid planId.";
    console.error(message, { planId });
    throw new Error(message);
  }

  try {
    return await requestJson<TResponse>(`/goals/${encodeURIComponent(safePlanId)}/coach`, {
      method: "POST",
      body: payload,
    });
  } catch (err) {
    console.error("[networkUtils] sendCoachMessage failed", {
      planId: safePlanId,
      payload,
      error: err,
    });
    throw err;
  }
}
