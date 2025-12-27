import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "bootstrap/dist/css/bootstrap.min.css";
import "./globals.css";
import "@/styles/custom.scss";
import "flag-icons/css/flag-icons.css";
import AuthProvider from "@/providers/session-provider";
import BootstrapClient from "@/components/BootstrapClient";
import { ToastProvider } from "@/components/ui/toast";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: {
    default: "Copyfy",
    template: "Copyfy | %s",
  },
  description: "Plateforme d'outils IA pour optimiser votre e-commerce",
  icons: {
    icon: [
      { url: "/img/new-favicon/favicon.ico" },
      { url: "/img/new-favicon/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/img/new-favicon/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: [
      { url: "/img/new-favicon/apple-touch-icon.png", sizes: "180x180" },
    ],
  },
  manifest: "/img/new-favicon/site.webmanifest",
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
          <ToastProvider>
            <BootstrapClient />
            {children}
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}



