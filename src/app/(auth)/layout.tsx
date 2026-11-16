import Link from "next/link";
import { WeftMark } from "@/components/brand";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="grid-wash flex min-h-dvh flex-col items-center justify-center gap-6 px-4 py-12">
      <Link href="/" className="flex items-center gap-2 text-ink">
        <WeftMark className="size-8 text-brand" />
        <span className="text-[17px] font-semibold tracking-[-0.02em]">Weft</span>
      </Link>
      {children}
    </main>
  );
}
