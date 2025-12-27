import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Génération d'Images",
};

export default function ImageGenerationLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

