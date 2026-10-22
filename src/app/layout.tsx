import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bagisawer — Dukung Kreator Favoritmu",
  description: "Platform dukungan kreator dan interaksi livestream yang dibuat untuk komunitas Indonesia.",
  applicationName: "Bagisawer"
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="id"><body>{children}</body></html>;
}