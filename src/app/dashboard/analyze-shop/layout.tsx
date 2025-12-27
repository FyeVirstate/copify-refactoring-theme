import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Analyser une Boutique",
};

export default function AnalyzeShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

