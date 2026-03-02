import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "jsonix.io",
  description: "jsonix.io - powerful local-first JSON tooling platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
