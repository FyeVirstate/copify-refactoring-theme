import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Recruter un Expert",
};

export default function HireLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

