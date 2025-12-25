import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import "@/styles/custom.scss";
import "flag-icons/css/flag-icons.css";
import AuthProvider from "@/providers/session-provider";
import BootstrapClient from "@/components/BootstrapClient";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "Copyfy - Outils IA pour E-commerce",
  description: "Plateforme d'outils IA pour optimiser votre e-commerce",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <head>
        {/* Preconnect to Wistia for faster video loading */}
        <link rel="preconnect" href="https://fast.wistia.net" />
        <link rel="preconnect" href="https://embed-ssl.wistia.com" />
        <link rel="dns-prefetch" href="https://fast.wistia.net" />
        <link rel="dns-prefetch" href="https://embed-ssl.wistia.com" />
        
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.2/css/all.min.css"
          integrity="sha512-SnH5WK+bZxgPHs44uWIX+LLJAJ9/2PkPKZ5QiAj6Ta86w+fsb2TkcmfRyVX3pBnMFcV7oQPJkl9QevSCWr3W6A=="
          crossOrigin="anonymous"
          referrerPolicy="no-referrer"
        />
          <link
            href="https://cdn.jsdelivr.net/npm/remixicon@4.5.0/fonts/remixicon.css"
            rel="stylesheet"
          />
          <script src="https://fast.wistia.net/assets/external/E-v1.js" async></script>
        </head>
      <body 
        className={`${inter.variable} antialiased bg-dark position-relative`}
        suppressHydrationWarning
      >
        <AuthProvider>
          <BootstrapClient />
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}



