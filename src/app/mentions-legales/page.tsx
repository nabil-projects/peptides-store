import type { Metadata } from "next";
import { LegalPage } from "@/app/legal-page";

export const metadata: Metadata = {
  title: "Mentions legales - BIP HORIZON",
};

export default function MentionsLegalesPage() {
  return <LegalPage title="Mentions legales" filename="mentions-legales.txt" />;
}
