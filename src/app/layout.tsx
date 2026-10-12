import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import { brand } from "@/lib/shop";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const oswald = Oswald({ variable: "--font-oswald", subsets: ["latin"] });

export const metadata: Metadata = {
  title: `${brand.name} | ${brand.city}`,
  description: `${brand.tagline} Book with your barber at ${brand.name}.`,
};

export const viewport: Viewport = {
  themeColor: "#0b0b0b",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${oswald.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
