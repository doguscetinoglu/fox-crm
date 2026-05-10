import { SignJWT, jwtVerify } from "jose";

export interface SessionUser {
  id: number;
  email: string;
  name: string;
  type: "admin" | "agent" | "customer";
  color?: string;
  isAdmin?: boolean;
}

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? "ticket-crm-super-secret-key-32ch!!"
);

export const COOKIE = "tcm_session";

export async function signToken(user: SessionUser): Promise<string> {
  return new SignJWT(user as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload as unknown as SessionUser;
  } catch {
    return null;
  }
}
