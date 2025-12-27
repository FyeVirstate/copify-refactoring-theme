import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Factures",
};

export default function InvoicesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

