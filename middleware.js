//frontend/middleware.js
import { NextResponse } from "next/server";
console.log("🔥 Middleware HIT:", request.nextUrl.pathname);
export const config = {
  matcher: ["/business/:path*"], // 🔥 خیلی مهم
};

export async function middleware(request) {
  const url = request.nextUrl;
  const pathname = url.pathname;

  const parts = pathname.split("/");
  const param = parts[2];

  // اگر ID بود
  if (/^\d+$/.test(param)) {
    try {
      const res = await fetch(
        `https://api.iranconnect.org/businesses/${param}`
      );

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
