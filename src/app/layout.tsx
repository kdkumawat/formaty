import type { Metadata, Viewport } from "next";
import { DM_Sans, DM_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  axes: ["opsz"],
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-dm-mono",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

const SITE_URL = process.env.SITE_URL || "https://formaty.dev";
const SITE_NAME = "Formaty";
const SITE_TITLE = "Formaty - Developer Data Toolkit | JSON, XML, YAML, CSV Formatter & Converter";
const CREATOR_NAME = "Kuldeep Kumawat";
const CREATOR_X = "https://x.com/kuldeep_kumawat";
const CREATOR_LINKEDIN = "https://www.linkedin.com/in/kdkumawat";
const SITE_DESCRIPTION =
  "Format, convert, validate, query, and visualize JSON, XML, YAML, TOML, CSV. Import cURL, inspect API responses, generate types. Works in browser-no data leaves your device. The most complete developer data tool online.";

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
    "JSON beautifier",
    "JSON diff",
    "JSON query",
    "JSONPath",
    "JMESPath",
    "JSON schema generator",
    "JSON to TypeScript",
    "JSON to YAML",
    "JSON to XML",
    "JSON to CSV",
    "XML formatter",
    "YAML formatter",
    "TOML formatter",
    "CSV formatter",
    "cURL to JSON",
    "JSON XML YAML converter",
    "data format converter",
    "JSON tree viewer",
    "JSON graph viewer",
    "JSON tools online",
    "developer tools",
    "local-first",
    "no signup",
    "browser tool",
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
  verification: {
    google: [
      "google9e393b4ac218ce25",
      "OKeIhvNauwJmKVtoeNvnqFWvMdkwy_07r9VaQWqeOSA",
    ],
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
    "XML, YAML, TOML, CSV formatter",
    "cURL input - paste and run API calls",
    "JSONPath and JMESPath query playground",
    "Format conversion: JSON↔XML, JSON↔YAML, JSON↔CSV, XML↔JSON, YAML↔JSON",
    "Tree view, table view, and interactive graph visualization",
    "JSON Schema generation from sample data",
    "Type generation (TypeScript, Python, Go, Java, Kotlin, Swift, Rust, C#, SQL)",
    "JSON diff tool with side-by-side comparison",
    "Flatten and unflatten nested JSON",
    "Shareable links with encoded state",
    "Pin toolbar actions for one-click access",
    "Session persistence - data always restored on reload",
    "Local-first, no data sent to any server",
    "Works offline with WebWorker processing",
  ],
  screenshot: `${SITE_URL}/og.png`,
  author: {
    "@type": "Person",
    name: CREATOR_NAME,
    url: CREATOR_LINKEDIN,
    sameAs: [CREATOR_LINKEDIN, CREATOR_X],
  },
  sameAs: ["https://github.com/kuldeep-kumawat/formaty"],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${dmSans.variable} ${dmMono.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t="light";try{var s=localStorage.getItem("formaty-session");if(s){var d=JSON.parse(s);if(d.themeMode==="dark"||d.themeMode==="light")t=d.themeMode;else t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}else{t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}}catch(e){t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}document.documentElement.setAttribute("data-theme",t);var e=document.createElement("style");e.id="formaty-theme-inline";e.textContent=t==="dark"?"html,body{--workspace-background:#0d0d0d;--workspace-panel:#141414;--workspace-border:#252525;--workspace-text:#ececec;--workspace-text-muted:#a3a3a3}":"html,body{--workspace-background:#f8f8f8;--workspace-panel:#ffffff;--workspace-border:#e8e8e8;--workspace-text:#0a0a0a;--workspace-text-muted:#545454}";document.head.appendChild(e)})();`,
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
