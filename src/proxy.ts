import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyToken } from "@/lib/session";

const PUBLIC = ["/login"];
const API_PREFIX = "/api";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC.some(p => pathname.startsWith(p))) return NextResponse.next();
  if (pathname.startsWith(API_PREFIX)) return NextResponse.next();
  if (pathname.startsWith("/_next") || pathname.includes(".")) return NextResponse.next();

  const token = request.cookies.get("tcm_session")?.value;
  if (!token) return NextResponse.redirect(new URL("/login", request.url));

  const user = await verifyToken(token);
  if (!user) {
    const res = NextResponse.redirect(new URL("/login", request.url));
    res.cookies.delete("tcm_session");
    return res;
  }

  // Müşteri → sadece /portal
  if (user.type === "customer" && !pathname.startsWith("/portal")) {
    return NextResponse.redirect(new URL("/portal", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
