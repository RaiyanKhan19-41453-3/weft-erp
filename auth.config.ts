import { betterAuth } from "better-auth";
import { organization } from "better-auth/plugins/organization";
import { ac, roles } from "./src/lib/permissions";

// Temporary config used only by `better-auth generate` to produce the schema.
export const auth = betterAuth({
  secret: "generate-only-secret-generate-only-secret",
  baseURL: "http://localhost:3000",
  emailAndPassword: { enabled: true },
  plugins: [organization({ ac, roles })],
});
