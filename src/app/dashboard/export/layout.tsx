import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Exportation de Produits",
};

export default function ExportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

