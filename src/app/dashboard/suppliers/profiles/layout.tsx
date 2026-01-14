import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Fournisseurs",
};

export default function SupplierProfilesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
