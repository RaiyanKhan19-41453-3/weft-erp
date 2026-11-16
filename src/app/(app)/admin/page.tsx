import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { AdminSummary } from "@/components/admin/admin-summary";

export const metadata: Metadata = {
  title: "Admin",
  description: "Workspace support overview for owners and admins.",
};

export const instant = false;

export default function AdminPage() {
  return (
    <>
      <PageHeader
        eyebrow={<span>Workspace / Admin</span>}
        title="Support overview"
        description="Members, plan limits and order volume for the active organization."
      />
      <AdminSummary />
    </>
  );
}
