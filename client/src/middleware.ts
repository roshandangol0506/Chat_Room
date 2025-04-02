import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  try {
    // Call backend to check if user is authenticated
    const authCheckResponse = await fetch("http://localhost:8000/checkAuth", {
      method: "GET",
      credentials: "include",
      headers: {
        Cookie: request.headers.get("cookie") || "",
      },
    });

    if (!authCheckResponse.ok) {
      throw new Error("Failed to fetch authentication data");
    }

    const authData = await authCheckResponse.json();

    // Redirect unauthorized users trying to access /Chat
    if (!authData.isAuthenticated && request.nextUrl.pathname.startsWith("/Chat")) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Redirect logged-in users away from login page
    if (authData.isAuthenticated && request.nextUrl.pathname.startsWith("/login")) {
      return NextResponse.redirect(new URL("/Chat", request.url));
    }

    return NextResponse.next();
  } catch (error) {
    console.error("Error during authentication check:", error);
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export const config = {
  matcher: ["/Chat/:path*", "/login"], // Applies middleware to /Chat and /login pages
};
