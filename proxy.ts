import { NextRequest, NextResponse } from "next/server";
import { isAiraLabsHostname } from "@/lib/aira-labs/domain";

export function proxy(request: NextRequest) {
  const hostname = request.headers.get("x-forwarded-host") ?? request.headers.get("host");
  const response = isAiraLabsHostname(hostname) && request.nextUrl.pathname === "/"
    ? NextResponse.rewrite(new URL("/aira-labs", request.url))
    : NextResponse.next();
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  if (process.env.NODE_ENV === "production") {
    response.headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  }
  return response;
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"
};
