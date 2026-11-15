import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { Providers } from "@/components/providers";
import "./globals.css";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Weft — Apparel operations console",
    template: "%s · Weft",
  },
  description:
    "A production-grade apparel ERP demo built with Next.js 16, React 19, TypeScript and Tailwind CSS v4. Virtualized order tables, server components, print-ready invoices and browser-local POs.",
  applicationName: "Weft",
  keywords: [
    "ERP",
    "apparel manufacturing",
    "Next.js",
    "React",
    "TypeScript",
    "TanStack Table",
  ],
  openGraph: {
    title: "Weft — Apparel operations console",
    description:
      "Order operations, production tracking and analytics for apparel manufacturing. Built as a Next.js 16 portfolio project.",
    type: "website",
    url: siteUrl,
    siteName: "Weft",
  },
  twitter: {
    card: "summary_large_image",
    title: "Weft — Apparel operations console",
    description:
      "Order operations, production tracking and analytics for apparel manufacturing.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f3f2ed" },
    { media: "(prefers-color-scheme: dark)", color: "#0b0e0c" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} min-h-dvh font-sans antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
