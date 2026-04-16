//frontend/middleware.js
import { NextResponse } from "next/server";

export async function middleware(request) {
  const url = request.nextUrl;

  // فقط مسیر business
  if (url.pathname.startsWith("/business/")) {
    const parts = url.pathname.split("/");
    const param = parts[2];

    // اگر عدد بود → یعنی ID
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
      } catch {}
    }
  }

  return NextResponse.next();
}
