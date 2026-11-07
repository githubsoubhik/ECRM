// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

import {canAccess} from "./lib/roles"

const secret = new TextEncoder().encode(process.env.JWT_SECRET);

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("token")?.value;
  const { pathname } = req.nextUrl;

  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    const { payload } = await jwtVerify(token, secret);
    const role = payload.role as string;

    if (!canAccess(role, pathname)) {
      return NextResponse.redirect(new URL("/unauthorized", req.url));
    }
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/leads/:path*",
    "/customers/:path*",
    "/reports/:path*",
    "/users/:path*",
    "/settings/:path*",
    "/tickets/:path*",
  ],
};