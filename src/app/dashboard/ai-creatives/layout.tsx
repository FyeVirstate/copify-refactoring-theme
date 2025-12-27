import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Créatives IA",
};

export default function AiCreativesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

