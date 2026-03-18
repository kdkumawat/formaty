import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

const SITE_URL = process.env.SITE_URL || "https://formaty.dev";
const SITE_NAME = "Formaty";
const SITE_TITLE = "Formaty — Developer Data Toolkit | JSON, XML, YAML, CSV Formatter & Converter";
const CREATOR_NAME = "Kuldeep Kumawat";
const CREATOR_X = "https://x.com/kuldeep_kumawat";
const CREATOR_LINKEDIN = "https://www.linkedin.com/in/kdkumawat";
const SITE_DESCRIPTION =
  "Format, convert, validate, query, and visualize JSON, XML, YAML, TOML, CSV. Import cURL, inspect API responses, generate types. Works in browser—no data leaves your device. The most complete developer data tool online.";

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
    "JSON query",
    "JSONPath",
    "JMESPath",
    "JSON schema",
    "JSON to TypeScript",
    "XML formatter",
    "YAML formatter",
    "TOML formatter",
    "CSV formatter",
    "cURL to JSON",
    "JSON XML YAML converter",
    "data format converter",
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

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: SITE_NAME,
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Any",
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  featureList: [
    "JSON formatter and validator",
    "XML, YAML, TOML, CSV support",
    "cURL input — paste and run API calls",
    "JSONPath and JMESPath query playground",
    "Format conversion and table view",
    "Tree view and graph visualization",
    "JSON Schema validation",
    "Type generation (TypeScript, Python, Go, Java, etc.)",
    "JSON diff tool",
    "Flatten and unflatten",
    "Shareable links (Ctrl+V paste shortcut)",
    "Local-first, no data sent to server",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t="light";try{var s=localStorage.getItem("formaty-session");if(s){var d=JSON.parse(s);if(d.themeMode==="dark"||d.themeMode==="light")t=d.themeMode;else t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}else{t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}}catch(e){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t);var e=document.createElement("style");e.id="formaty-theme-inline";e.textContent=t==="dark"?"html,body{--workspace-background:#0b0b0b;--workspace-panel:#111111;--workspace-border:#1f1f1f;--workspace-text:#e5e5e5;--workspace-text-muted:#9ca3af}":"html,body{--workspace-background:#f5f5f5;--workspace-panel:#ffffff;--workspace-border:#e5e5e5;--workspace-text:#171717;--workspace-text-muted:#737373}";document.head.appendChild(e)})();`,
          }}
        />
      </head>
      <body className="antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
      </body>
    </html>
  );
}
