import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Boutiques Partagées",
};

export default function ShareLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

