import { authStore } from "./auth";

type ApiResponse<T> = { data: T; meta: Record<string, unknown> };
type ApiError = { error: { code: string; message: string } };

async function request<T>(
  path: string,
  init?: RequestInit
): Promise<ApiResponse<T>> {
  const token = authStore.getAccess();
  const headers = new Headers(init?.headers);
  headers.set("accept", "application/json");
  if (!(init?.body instanceof FormData))
    headers.set("content-type", "application/json");
  if (token) headers.set("authorization", `Bearer ${token}`);

  const response = await fetch(path, { ...init, headers });
  if (!response.ok) {
    const payload = (await response.json()) as ApiError;
    throw new Error(payload.error.message);
  }
  return (await response.json()) as ApiResponse<T>;
}

export const api = {
  get: async <T>(path: string) => (await request<T>(path)).data,
  getWithMeta: <T>(path: string) => request<T>(path),
  post: async <T>(path: string, body: unknown, isForm = false) =>
    (
      await request<T>(path, {
        method: "POST",
        body: isForm ? (body as FormData) : JSON.stringify(body)
      })
    ).data,
  patch: async <T>(path: string, body: unknown) =>
    (await request<T>(path, { method: "PATCH", body: JSON.stringify(body) }))
      .data,
  delete: async <T>(path: string) =>
    (await request<T>(path, { method: "DELETE" })).data
};
