import { HomePage } from "@/components/HomePage";
import { ALL_TOOL_ROUTES, getToolConfig, SITE_URL } from "@/lib/seo";

export default function Home() {
  const itemList = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Formaty developer tools",
    itemListElement: ALL_TOOL_ROUTES.map((route, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: getToolConfig(route).h1,
      url: `${SITE_URL}/${route}`,
    })),
  };
  const breadcrumb = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "Playground", item: `${SITE_URL}/playground` },
      { "@type": "ListItem", position: 3, name: "Tools", item: `${SITE_URL}/json-formatter` },
    ],
  };
  const organization = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Formaty",
    url: SITE_URL,
    description:
      "Free local-first developer tools: JSON, XML, YAML, TOML, CSV formatting and conversion, diff, query, type generation, and developer utils.",
    sameAs: ["https://github.com/kdkumawat/formaty"],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumb) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organization) }} />
      <HomePage />
    </>
  );
}
