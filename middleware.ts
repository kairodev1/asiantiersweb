import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, isValidToken } from "@/lib/session";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname === "/api" || pathname === "/api/") {
    const url = req.nextUrl.clone();
    url.pathname = "/api-docs";
    return NextResponse.rewrite(url);
  }

  const authed = await isValidToken(req.cookies.get(ADMIN_COOKIE)?.value);

  if (pathname.startsWith("/api-docs")) {
    return NextResponse.redirect(new URL("/api", req.url));
  }

  if (pathname.startsWith("/admin/login")) {
    return authed ? NextResponse.redirect(new URL("/admin/dashboard", req.url)) : NextResponse.next();
  }

  if (pathname.startsWith("/admin/dashboard")) {
    if (!authed) {
      const url = new URL("/admin/login", req.url);
      url.searchParams.set("next", pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/admin") && pathname !== "/api/admin/auth") {
    return authed ? NextResponse.next() : NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api", "/api-docs", "/admin/dashboard/:path*", "/admin/login", "/api/admin/:path*"],
};
