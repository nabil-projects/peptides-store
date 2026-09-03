import type { Metadata } from "next";
import { LegalPage } from "@/app/legal-page";

export const metadata: Metadata = {
  title: "Conditions generales de vente - BIP HORIZON",
};

export default function ConditionsGeneralesVentePage() {
  return (
    <LegalPage
      title="Conditions generales de vente"
      filename="conditions-generales-vente.txt"
    />
  );
}
