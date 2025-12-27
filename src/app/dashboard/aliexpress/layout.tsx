import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AliExpress",
};

export default function AliexpressLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

