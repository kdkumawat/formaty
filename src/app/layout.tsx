import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";

const SITE_URL = "https://jsonix.vercel.app";
const SITE_NAME = "jsonix";
const SITE_TITLE = "jsonix — Local-first JSON Tools";
const CREATOR_NAME = "Kuldeep Kumawat";
const CREATOR_X = "https://x.com/kuldeep_kumawat";
const CREATOR_LINKEDIN = "https://www.linkedin.com/in/kdkumawat";
const SITE_DESCRIPTION =
  "Powerful local-first JSON tooling platform for formatting, validating, transforming, diffing, and generating types from JSON.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  keywords: [
    "JSON formatter",
    "JSON validator",
    "JSON diff",
    "JSON schema",
    "JSON to TypeScript",
    "JSON tools",
    "developer tools",
    "local-first",
  ],
  authors: [
    {
      name: CREATOR_NAME,
      url: CREATOR_LINKEDIN,
    },
  ],
  creator: CREATOR_NAME,
  publisher: CREATOR_NAME,
  category: "developer tools",
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    creator: "@kuldeep_kumawat",
  },
  other: {
    "profile:linkedin": CREATOR_LINKEDIN,
    "profile:x": CREATOR_X,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
