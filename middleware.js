//frontend/middleware.js
import { NextResponse } from "next/server";

export const config = {
  matcher: ["/business/:path*"],
};

export async function middleware(request) {
  const pathname = request.nextUrl.pathname;

 

  const parts = pathname.split("/");
  const param = parts[2];

  if (/^\d+$/.test(param)) {
    try {
      const isStaging = request.nextUrl.hostname.includes("staging");

      const API_BASE = isStaging
        ? "https://api-staging.iranconnect.org"
        : "https://api.iranconnect.org";

      const res = await fetch(`${API_BASE}/businesses/${param}`);

      if (res.ok) {
        const data = await res.json();

        if (data?.slug) {
          return NextResponse.redirect(
            new URL(`/business/${data.slug}`, request.url),
            301
          );
        }
      }
    } catch (err) {
      console.error("Middleware error:", err);
    }
  }

  return NextResponse.next();
}
