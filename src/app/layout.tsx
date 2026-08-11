import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
  axes: ["opsz"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
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
const SITE_TITLE = "Formaty - Format, Convert, Compare & Utils | JSON, XML, YAML Toolkit";
const CREATOR_NAME = "Kuldeep Kumawat";
const CREATOR_X = "https://x.com/kuldeep_kumawat";
const CREATOR_LINKEDIN = "https://www.linkedin.com/in/kdkumawat";
const SITE_DESCRIPTION =
  "Format, convert, compare, and developer utils for JSON, XML, YAML, TOML, CSV. UUID, Base64, JWT, hash, URL encode, and more. Import cURL, query with JSONPath, generate types. Runs in your browser - no data leaves your device.";

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
    "JSON compare",
    "list compare",
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
    "UUID generator",
    "Base64 encode decode",
    "JWT decoder",
    "SHA-256 hash",
    "URL encode decode",
    "timestamp converter",
    "developer utils",
    "JSON XML YAML converter",
    "data format converter",
    "JSON tree viewer",
    "JSON graph viewer",
    "JSON table view",
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
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${jetbrainsMono.variable} ${spaceGrotesk.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t="dark";try{var s=localStorage.getItem("formaty-session");if(s){var d=JSON.parse(s);if(d.themeMode==="dark"||d.themeMode==="light")t=d.themeMode;else if(d.themeMode==="system")t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}}catch(e){}document.documentElement.setAttribute("data-theme",t);var e=document.createElement("style");e.id="formaty-theme-inline";e.textContent=t==="dark"?"html,body{--background:#0a0a10;--foreground:#ececf1;--card:#12121a;--card-foreground:#ececf1;--popover:#171721;--popover-foreground:#ececf1;--border:#23232e;--input:#2f2f3c;--muted:#191924;--muted-foreground:#9a9aa5;--accent:#1e1e2b;--accent-foreground:#ececf1;--secondary:#1c1c27;--secondary-foreground:#ececf1;--primary:oklch(0.72 0.19 280);--ring:oklch(0.72 0.19 280);--destructive:oklch(0.64 0.2 25);--workspace-background:#0a0a10;--workspace-panel:#12121a;--workspace-border:#23232e;--workspace-text:#ececf1;--workspace-text-muted:#9a9aa5}":"html,body{--background:#f7f7fa;--foreground:#181820;--card:#ffffff;--card-foreground:#181820;--popover:#ffffff;--popover-foreground:#181820;--border:#e7e7ef;--input:#d8d8e2;--muted:#eceef3;--muted-foreground:#5f5f6b;--accent:#eef0f5;--accent-foreground:#181820;--secondary:#eef0f5;--secondary-foreground:#181820;--primary:oklch(0.56 0.22 278);--ring:oklch(0.56 0.22 278);--destructive:oklch(0.58 0.23 25);--workspace-background:#f7f7fa;--workspace-panel:#ffffff;--workspace-border:#e7e7ef;--workspace-text:#181820;--workspace-text-muted:#5f5f6b}";document.head.appendChild(e)})();`,
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
