import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Formations",
};

export default function CoursesLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

