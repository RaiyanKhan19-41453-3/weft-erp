import { createAccessControl } from "better-auth/plugins/access";

export const statement = {
  order: ["create", "read", "update", "status"],
  material: ["read", "update"],
  analytics: ["read"],
  invoice: ["read"],
  organization: ["update"],
} as const;

export const ac = createAccessControl(statement);

export const roles = {
  owner: ac.newRole({
    order: ["create", "read", "update", "status"],
    material: ["read", "update"],
    analytics: ["read"],
    invoice: ["read"],
    organization: ["update"],
  }),
  admin: ac.newRole({
    order: ["create", "read", "update", "status"],
    material: ["read", "update"],
    analytics: ["read"],
    invoice: ["read"],
    organization: ["update"],
  }),
  merchandiser: ac.newRole({
    order: ["create", "read", "update"],
    material: ["read"],
    analytics: ["read"],
    invoice: ["read"],
  }),
  factory: ac.newRole({
    order: ["read", "status"],
    material: ["read", "update"],
    analytics: ["read"],
    invoice: ["read"],
  }),
  viewer: ac.newRole({
    order: ["read"],
    material: ["read"],
    analytics: ["read"],
    invoice: ["read"],
  }),
};

export type WeftRole = keyof typeof roles;
