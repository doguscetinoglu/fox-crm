import { cookies } from "next/headers";
import { verifyToken, type SessionUser } from "./session";

export async function getSession(): Promise<SessionUser | null> {
  const store = await cookies();
  const token = store.get("tcm_session")?.value;
  if (!token) return null;
  return verifyToken(token);
}

export async function requireSession(): Promise<SessionUser> {
  const s = await getSession();
  if (!s) throw new Error("Unauthorized");
  return s;
}

export async function requireAdmin(): Promise<SessionUser> {
  const s = await requireSession();
  if (s.type !== "admin") throw new Error("Forbidden");
  return s;
}
