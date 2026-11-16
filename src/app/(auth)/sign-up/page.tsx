import type { Metadata } from "next";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = {
  title: "Create a workspace",
  description: "Create a multi-tenant Weft workspace.",
};

export default function SignUpPage() {
  return <SignUpForm />;
}
