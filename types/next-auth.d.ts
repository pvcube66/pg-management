import { NextAuthOptions, DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: string;
      pgId?: string;
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
    pgId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: string;
    pgId?: string;
    id?: string;
  }
}
