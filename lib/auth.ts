import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import dbConnect from "@/lib/db";
import { User } from "@/models/User";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Missing email or password");
        }

        await dbConnect();
        const user = await User.findOne({ email: credentials.email });

        if (!user) {
          throw new Error("User not found");
        }

        if (!user.passwordHash) {
             throw new Error("Please login with Google");
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash);

        if (!isValid) {
          throw new Error("Invalid password");
        }

        return {
          id: user._id.toString(),
          email: user.email,
          role: user.role,
          pgId: user.pgId?.toString(),
          name: user.email.split('@')[0], // Fallback name
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.pgId = user.pgId;
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.role = token.role as string;
        session.user.pgId = token.pgId as string;
        session.user.id = token.id as string;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
        if (account?.provider === 'google') {
            await dbConnect();
            const existingUser = await User.findOne({ email: user.email });
            if (!existingUser) {
                // Determine role logic for new google users? 
                // For now, default to 'incharge' or reject. 
                // Let's create as 'incharge' without PG assigned for safety, or reject.
                // Prompt implies specific seeding. We'll allow creation but role needs assignment.
                // Actually, let's just return true if they exist, or create a basic user.
                
                // Note: Real world app would probably have a signup flow.
                // Here we will just create a basic user with no role if not exists
                 const newUser = await User.create({
                    email: user.email,
                    role: 'incharge', // Default safe role
                 });
                 user.role = newUser.role;
                 user.id = newUser._id.toString();
            } else {
                user.role = existingUser.role;
                user.pgId = existingUser.pgId?.toString();
                user.id = existingUser._id.toString();
            }
        }
        return true;
    }
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
