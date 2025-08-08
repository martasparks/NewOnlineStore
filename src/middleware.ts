// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return req.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value, options }) => {
          res.cookies.set({ name, value, ...options })
        })
      },
    },
  });

  const pathname = req.nextUrl.pathname;
  const { data: { user } } = await supabase.auth.getUser();

  // Aizsargā admin
  if (pathname.startsWith("/admin")) {
    if (!user) return NextResponse.redirect(new URL("/auth/login", req.url));

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL("/auth/unauthorized", req.url));
    }
    return res;
  }

  // Ielogotam aizliedz login/register
  if (pathname === "/auth/login" || pathname === "/auth/register" || pathname === "/auth/verify-email") {
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();
      return NextResponse.redirect(new URL(profile?.role === "admin" ? "/admin" : "/", req.url));
    }
    return res;
  }

  // Unauthorized – tikai ielogotam ne-adminam
  if (pathname === "/auth/unauthorized") {
    if (!user) return NextResponse.redirect(new URL("/auth/login", req.url));
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();
    if (profile?.role === "admin") return NextResponse.redirect(new URL("/admin", req.url));
    return res;
  }

  return res;
}

export const config = {
  matcher: [
    "/admin",
    "/admin/:path*",
    "/auth/login",
    "/auth/register",
    "/auth/verify-email",
    "/auth/unauthorized",
  ],
};