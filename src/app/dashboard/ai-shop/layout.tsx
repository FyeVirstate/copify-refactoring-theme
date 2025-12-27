import { Metadata } from "next";

export const metadata: Metadata = {
  title: "CopyfyAI",
};

export default function AiShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

