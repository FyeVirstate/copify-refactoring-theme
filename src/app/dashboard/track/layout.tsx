import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Suivi des Boutiques",
};

export default function TrackLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

