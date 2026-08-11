import { getIronSession, type SessionOptions } from "iron-session";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

interface SessionData {
  userId: string;
  username: string;
  displayName: string;
}

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET || "a-very-long-secret-key-at-least-32-chars!!",
  cookieName: "couple-space-session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    httpOnly: true,
    sameSite: "lax" as const,
    maxAge: 60 * 60 * 24 * 30,
  },
};

const publicRoutes = ["/login", "/register"];
const publicApiRoutes = ["/api/auth/login", "/api/auth/register"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (
    publicRoutes.some((route) => pathname.startsWith(route)) ||
    publicApiRoutes.some((route) => pathname.startsWith(route)) ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/api/auth/session") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check session using Edge-compatible API
  const response = NextResponse.next();
  const session = await getIronSession<SessionData>(
    request,
    response,
    sessionOptions
  );

  if (!session.userId) {
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "未登录" }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
