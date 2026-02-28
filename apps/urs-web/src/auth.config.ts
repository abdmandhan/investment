import type { NextAuthConfig } from "next-auth";

// Edge-compatible middleware config
// This config only uses Edge-compatible primitives
export const authConfig = {
  pages: {
    signIn: "/login",
    error: "/login",
  },
  secret: process.env.AUTH_SECRET,
  providers: [],
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      const isLoggedIn = !!auth?.user;
      const isOnLoginPage = nextUrl.pathname === "/login";
      const isOnAuthAPI = nextUrl.pathname.startsWith("/api/auth");

      if (isOnAuthAPI) return true;

      // Redirect logged-in users away from the login page
      if (isOnLoginPage && isLoggedIn) {
        return Response.redirect(new URL("/", nextUrl.origin));
      }
      if (isOnLoginPage) return true;

      if (isLoggedIn) return true;

      return false;
    },
  },
} satisfies NextAuthConfig;
