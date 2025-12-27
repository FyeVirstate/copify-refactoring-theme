import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Top Publicités",
};

export default function AdsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

