import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Navigation from "@/components/Navigation";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Live TV - Siaran Langsung Online",
  description:
    "Jelajahi, cari, filter, dan tonton channel live TV dari playlist M3U eksternal melalui web player.",
  keywords: [
    "live tv",
    "siaran langsung",
    "iptv",
    "m3u playlist",
    "hls streaming",
    "tv online",
  ],
  openGraph: {
    title: "Live TV - Siaran Langsung Online",
    description: "Direktori live TV berbasis playlist M3U dengan web player HLS.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <Navigation />
        {children}
      </body>
    </html>
  );
}
