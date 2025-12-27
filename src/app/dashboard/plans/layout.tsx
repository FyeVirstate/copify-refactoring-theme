import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Abonnements",
};

export default function PlansLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

