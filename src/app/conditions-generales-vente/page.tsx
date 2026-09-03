import type { Metadata } from "next";
import { LegalPage } from "@/app/legal-page";

export const metadata: Metadata = {
  title: "Conditions générales de vente - BIP HORIZON",
};

export default function ConditionsGeneralesVentePage() {
  return (
    <LegalPage
      title="Conditions générales de vente"
      filename="conditions-generales-vente.txt"
    />
  );
}
