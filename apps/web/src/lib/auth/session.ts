export type PortalRole = "pregnant" | "midwife";
export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  role: "PREGNANT_PERSON" | "MIDWIFE";
};
const KEY = "sabi-session";
const api = import.meta.env.VITE_API_URL ?? "http://localhost:8080";
export function readSession(): { token: string; user: SessionUser } | null {
  if (typeof sessionStorage === "undefined") return null;
  try {
    return JSON.parse(sessionStorage.getItem(KEY) ?? "null");
  } catch {
    return null;
  }
}
export function sessionToken() {
  return readSession()?.token ?? "";
}
export function hasSession(role: PortalRole) {
  return (
    readSession()?.user.role ===
    (role === "pregnant" ? "PREGNANT_PERSON" : "MIDWIFE")
  );
}
export function sessionUser() {
  return readSession()?.user ?? null;
}
export function endSession() {
  if (typeof sessionStorage !== "undefined") sessionStorage.removeItem(KEY);
}
export async function authenticate(
  path: "login" | "register",
  body: Record<string, unknown>,
) {
  const response = await fetch(`${api}/auth/${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const result = await response.json();
  if (!response.ok) throw new Error(result.message ?? "Could not sign in.");
  sessionStorage.setItem(KEY, JSON.stringify(result));
  return result as { token: string; user: SessionUser };
}
