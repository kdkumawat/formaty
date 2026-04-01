import type { Metadata } from "next";
import { DocsThemeProvider } from "@/components/DocsThemeProvider";

export const metadata: Metadata = {
  title: "Documentation – formaty",
  description:
    "formaty feature guide: JSON, XML, YAML, TOML, CSV converter, multi-tab, command palette, diff, history, query playground, cURL, type generation, schema validation",
};

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <DocsThemeProvider>{children}</DocsThemeProvider>;
}
