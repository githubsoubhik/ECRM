import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const PUBLIC_PATHS = ["/login"];               // the only open page
const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(req) {
  const { pathname } = req.nextUrl;
  const token = req.cookies.get("token")?.value;

  let payload = null;
  if (token) {
    try { payload = (await jwtVerify(token, secret)).payload; } catch {}
  }

  const isPublic = PUBLIC_PATHS.includes(pathname);

  if (!payload && !isPublic) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    const res = NextResponse.redirect(url);
    if (token) res.cookies.delete("token");     // remove a fake or expired cookie
    return res;
  }

  if (payload && isPublic) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  const res = NextResponse.next();
  res.headers.set("Cache-Control", "no-store"); // Back button won't show private pages after logout
  return res;
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|svg|webp|ico|css|js)$).*)"],
};