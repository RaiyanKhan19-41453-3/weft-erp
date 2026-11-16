import type { Metadata } from "next";
import { PageHeader } from "@/components/page-header";
import { TenantSettingsForm } from "@/components/settings/tenant-settings-form";

export const metadata: Metadata = {
  title: "Workspace settings",
  description: "Per-tenant branding, modules and plan limits.",
};

export const instant = false;

export default function SettingsPage() {
  return (
    <>
      <PageHeader
        eyebrow={<span>Workspace / Settings</span>}
        title="Workspace settings"
        description="Branding, module flags and plan limits for the active organization."
      />
      <TenantSettingsForm />
    </>
  );
}
