import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Publicités Sauvegardées",
};

export default function SavedAdsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

