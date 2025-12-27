import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Top Boutiques",
};

export default function ShopsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

