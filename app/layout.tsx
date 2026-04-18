import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { Header } from "@/components/layout/header";
import { MobileNav } from "@/components/layout/mobile-nav";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-poppins",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
  ),
  title: {
    default: "CarNest — Marketplace Xe Mô Hình",
    template: "%s | CarNest",
  },
  description:
    "Mua bán xe mô hình diecast chất lượng cao. Hot Wheels, Tomica, Matchbox, Majorette và hơn thế nữa.",
  keywords: ["xe mô hình", "diecast", "hot wheels", "tomica", "matchbox"],
  openGraph: {
    type: "website",
    locale: "vi_VN",
    siteName: "CarNest",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body className={`${inter.variable} ${poppins.variable} font-sans`}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1 pb-16 md:pb-0">{children}</main>
          </div>
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
