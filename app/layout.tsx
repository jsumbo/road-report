import type { Metadata } from "next";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://report.nrf.gov.lr";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Report Road Condition — NRF Liberia",
    template: "%s | Road Report · NRF Liberia",
  },
  description:
    "Report damaged roads, potholes, flooding, and other road conditions across Liberia's 15 counties.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col font-sans antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
