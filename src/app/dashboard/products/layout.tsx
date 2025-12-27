import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Top Produits",
};

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

