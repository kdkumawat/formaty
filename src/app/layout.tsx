import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { MotionConfig } from "framer-motion";
import { Archivo, Geist, JetBrains_Mono } from "next/font/google";
import { ConsentBanner } from "@/components/ConsentBanner";
import { ServiceWorkerRegister } from "@/components/ServiceWorkerRegister";
import { UpdateToast } from "@/components/UpdateToast";
import { DARK_THEME_CSS, LIGHT_THEME_CSS } from "@/lib/utils/themeTokens";
import "./globals.css";

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-jetbrains-mono",
  display: "swap",
  preload: false, // only the editor/code blocks use it
});

// Variable font with the width axis: headings use font-stretch 118%.
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  colorScheme: "dark light",
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0A0B0C" },
    { media: "(prefers-color-scheme: light)", color: "#F6F6F4" },
  ],
};

const SITE_URL = process.env.SITE_URL || "https://formaty.dev";
const SITE_NAME = "Formaty";
const SITE_TITLE = "Formaty - The Developer Data Workspace";
const CREATOR_NAME = "Kuldeep Kumawat";
const CREATOR_X = "https://x.com/kuldeep_kumawat";
const CREATOR_LINKEDIN = "https://www.linkedin.com/in/kdkumawat";
const SITE_DESCRIPTION =
  "Formaty is the Developer Data Workspace: format, convert, compare, reconcile, and query JSON, XML, YAML, TOML, CSV, and lists; generate SQL, TypeScript, Go, Python, and schemas from data; import and execute cURL. Runs 100% locally in your browser - no data leaves your device, no signup.";

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
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: "black-translucent",
  },
  formatDetection: { telephone: false, address: false, email: false },
  alternates: {
    canonical: "/",
  },
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    shortcut: "/icon.svg",
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: SITE_NAME,
    locale: "en_US",
    type: "website",
    images: [{ url: `${SITE_URL}/og.png`, width: 1200, height: 630, alt: SITE_TITLE }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    creator: "@kuldeep_kumawat",
    images: [`${SITE_URL}/og.png`],
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

const webSiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: SITE_NAME,
  url: SITE_URL,
  description: SITE_DESCRIPTION,
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
  sameAs: ["https://github.com/kdkumawat/formaty"],
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
      className={`${geist.variable} ${jetbrainsMono.variable} ${archivo.variable}`}
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){var t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light";try{var s=localStorage.getItem("formaty-session");if(s){var d=JSON.parse(s);if(d.themeMode==="dark"||d.themeMode==="light")t=d.themeMode;else if(d.themeMode==="system")t=window.matchMedia("(prefers-color-scheme: dark)").matches?"dark":"light"}}catch(e){}document.documentElement.setAttribute("data-theme",t);var e=document.createElement("style");e.id="formaty-theme-inline";e.textContent=t==="dark"?${JSON.stringify(DARK_THEME_CSS)}:${JSON.stringify(LIGHT_THEME_CSS)};document.head.appendChild(e)})();`,
          }}
        />
      </head>
      <body className="antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-md focus:bg-primary focus:px-3 focus:py-1.5 focus:text-sm focus:font-semibold focus:text-primary-foreground focus:shadow-lg"
        >
          Skip to main content
        </a>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteJsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {/* Google Analytics 4 - only loads when NEXT_PUBLIC_GA_MEASUREMENT_ID is set */}
        {process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ? (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}`}
              strategy="afterInteractive"
            />
            <Script id="formaty-ga-init" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('consent', 'default', {
                  ad_storage: 'denied',
                  analytics_storage: 'denied',
                  personalization_storage: 'denied',
                  functionality_storage: 'denied',
                  security_storage: 'granted',
                  wait_for_update: 500,
                });
                try {
                  if (localStorage.getItem('formaty-ga-consent') === 'accepted') {
                    gtag('consent', 'update', { analytics_storage: 'granted', functionality_storage: 'granted' });
                    gtag('config', '${process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID}');
                  }
                } catch(e) {}
              `}
            </Script>
          </>
        ) : null}
        <MotionConfig reducedMotion="user">
          {children}
        </MotionConfig>
        <ServiceWorkerRegister />
        <UpdateToast />
        <ConsentBanner />
      </body>
    </html>
  );
}
