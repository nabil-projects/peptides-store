import type { Metadata } from "next";
import { LegalPage } from "@/app/legal-page";

export const metadata: Metadata = {
  title: "Mentions légales - BIP HORIZON",
};

export default function MentionsLegalesPage() {
  return <LegalPage title="Mentions légales" filename="mentions-legales.txt" />;
}
