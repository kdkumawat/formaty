import type { Metadata } from "next";
import { KitPreview } from "./KitPreview";

export const metadata: Metadata = {
  title: "UI kit preview",
  robots: { index: false },
};

export default function KitPage() {
  return <KitPreview />;
}
