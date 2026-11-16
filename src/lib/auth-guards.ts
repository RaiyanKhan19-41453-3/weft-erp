import { headers } from "next/headers";
import { and, eq } from "drizzle-orm";
import { auth } from "./auth";
import { db } from "./db";
import { member } from "./db/auth-schema";
import { DEMO_ORG_ID } from "./constants";
import type { WeftRole } from "./permissions";

export type Viewer = {
  authenticated: boolean;
  userId: string | null;
  email: string | null;
  role: WeftRole | "public";
  orgId: string;
};

const ROLE_PERMISSIONS: Record<WeftRole | "public", string[]> = {
  owner: ["order:create", "order:read", "order:update", "order:status", "material:read", "material:update", "analytics:read", "invoice:read", "organization:update"],
  admin: ["order:create", "order:read", "order:update", "order:status", "material:read", "material:update", "analytics:read", "invoice:read", "organization:update"],
  merchandiser: ["order:create", "order:read", "order:update", "material:read", "analytics:read", "invoice:read"],
  factory: ["order:read", "order:status", "material:read", "material:update", "analytics:read", "invoice:read"],
  viewer: ["order:read", "material:read", "analytics:read", "invoice:read"],
  public: ["order:read", "material:read", "analytics:read", "invoice:read"],
};

export function hasPermission(viewer: Viewer, resource: string, action: string) {
  return ROLE_PERMISSIONS[viewer.role].includes(`${resource}:${action}`);
}

export async function getViewer(): Promise<Viewer> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    return {
      authenticated: false,
      userId: null,
      email: null,
      role: "public",
      orgId: DEMO_ORG_ID,
    };
  }

  const orgId = session.session.activeOrganizationId ?? DEMO_ORG_ID;
  const [membership] = await db
    .select({ role: member.role })
    .from(member)
    .where(and(eq(member.userId, session.user.id), eq(member.organizationId, orgId)))
    .limit(1);

  return {
    authenticated: true,
    userId: session.user.id,
    email: session.user.email,
    role: (membership?.role ?? "viewer") as WeftRole,
    orgId,
  };
}

export async function requireViewer() {
  const viewer = await getViewer();
  if (!viewer.authenticated) return null;
  return viewer;
}
