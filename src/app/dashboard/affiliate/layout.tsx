import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Affiliation",
};

export default function AffiliateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

