// lib/auth.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "./prisma";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
  },

  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        phone: { label: "Phone", type: "tel" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.phone || !credentials?.password) {
          throw new Error("Missing credentials");
        }

        const user = await prisma.user.findUnique({
          where: { phone: credentials.phone },
        });

        if (!user) {
          throw new Error("User not found");
        }

        if (user.status !== "APPROVED") {
          throw new Error("ACCOUNT_NOT_APPROVED");
        }

        const isValid = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!isValid) {
          throw new Error("Invalid password");
        }

        // ---- Check session limit based on role ----
        let limit = 0;
        switch (user.role) {
          case "SHOP_OWNER":
          case "DELIVERY_BOY":
            limit = 1;
            break;
          case "SUPPLIER":
            limit = 2;
            break;
          default:
            limit = Infinity; // ADMIN unlimited
        }

        if (limit < Infinity) {
          const sessionCount = await prisma.session.count({
            where: { userId: user.id },
          });
          if (sessionCount >= limit) {
            throw new Error("SESSION_LIMIT_EXCEEDED");
          }
        }

        // ---- Create session record ----
        const sessionToken = randomUUID();

        // Extract IP address safely from headers only
        const rawForwarded = req?.headers?.["x-forwarded-for"];
        let ip = "unknown";
        if (typeof rawForwarded === "string") {
          ip = rawForwarded.split(",")[0].trim();
        }

        // Extract User-Agent safely
        const rawUserAgent = req?.headers?.["user-agent"];
        const userAgent = typeof rawUserAgent === "string" ? rawUserAgent : "";

        try {
          await prisma.session.create({
            data: {
              userId: user.id,
              token: sessionToken,
              ipAddress: ip,
              userAgent,
            },
          });
        } catch (e) {
          console.error("Failed to create session", e);
        }

        // Return the user with the sessionId attached
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          sessionId: sessionToken,
        };
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // New sign‑in? Copy the sessionId into the token
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.sessionId = (user as any).sessionId;
      }

      // Verify user is still approved and session is valid
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: { status: true },
        });
        if (!dbUser || dbUser.status !== "APPROVED") {
          return {};
        }

        // Verify session still exists
        if (token.sessionId) {
          const session = await prisma.session.findUnique({
            where: { token: token.sessionId as string },
          });
          if (!session) {
            return {};
          }
        }
      }

      return token;
    },

    async session({ session, token }) {
      if (!token?.id) {
        return null as any;
      }
      if (session.user) {
        session.user.role = token.role as any;
        session.user.id = token.id as string;
        (session as any).sessionId = token.sessionId as string;
      }
      return session;
    },
  },

  events: {
    async signOut({ token }) {
      if (token?.sessionId) {
        await prisma.session.deleteMany({
          where: { token: token.sessionId as string },
        });
      }
    },
  },

  pages: {
    signIn: "/login",
    error: "/auth-error",
  },

  secret: process.env.NEXTAUTH_SECRET,
};