import type { Metadata } from "next";
import { LegalPage } from "@/app/legal-page";

export const metadata: Metadata = {
  title: "Politique de confidentialite - BIP HORIZON",
};

export default function PolitiqueConfidentialitePage() {
  return (
    <LegalPage
      title="Politique de confidentialite"
      filename="politique-confidentialite.txt"
    />
  );
}
