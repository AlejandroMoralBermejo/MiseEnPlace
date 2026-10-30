import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, Figtree } from "next/font/google";
import { InstallPromptCapture } from "@/components/InstallPromptCapture";
import "./globals.css";

const figtree = Figtree({
  subsets: ["latin"],
  variable: "--font-figtree",
});

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  variable: "--font-bricolage",
});

export const metadata: Metadata = {
  title: "MiseEnPlace - Planificador de comidas familiares",
  description: "Organiza las comidas de tu familia, gestiona el inventario y crea listas de compras.",
  applicationName: "MiseEnPlace",
  appleWebApp: {
    capable: true,
    title: "MiseEnPlace",
    statusBarStyle: "black",
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: "#0f3440",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${figtree.variable} ${bricolage.variable} font-sans antialiased`}>
        <InstallPromptCapture />
        {children}
      </body>
    </html>
  );
}
