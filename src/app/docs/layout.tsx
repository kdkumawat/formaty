import { DocsThemeProvider } from "@/components/DocsThemeProvider";

export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return <DocsThemeProvider>{children}</DocsThemeProvider>;
}
