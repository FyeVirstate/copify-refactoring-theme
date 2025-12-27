import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fournisseurs",
};

export default function SuppliersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

