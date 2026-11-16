import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { nextCookies } from "better-auth/next-js";
import { organization } from "better-auth/plugins/organization";
import { db } from "./db";
import { ac, roles } from "./permissions";
import {
  account,
  invitation,
  member,
  organization as organizationTable,
  session,
  user,
  verification,
} from "./db/auth-schema";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user,
      session,
      account,
      verification,
      organization: organizationTable,
      member,
      invitation,
    },
  }),
  emailAndPassword: { enabled: true },
  session: { cookieCache: { enabled: true, maxAge: 5 * 60 } },
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3100",
    "http://127.0.0.1:3100",
    "https://*.vercel.app",
  ],
  plugins: [organization({ ac, roles }), nextCookies()],
});
