import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/AppProviders";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import CartSidebar from "@/components/shop/CartSidebar";
import QuickViewModal from "@/components/shop/QuickViewModal";
import "@/styles/globals.css";

const faviconSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%230f172a'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='central' text-anchor='middle' font-family='Georgia%2C serif' font-size='14' font-weight='300' letter-spacing='1' fill='%23ffffff'%3EZ%3C/text%3E%3C/svg%3E";

const appleIconSvg =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'%3E%3Crect width='180' height='180' fill='%230f172a'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='central' text-anchor='middle' font-family='Georgia%2C serif' font-size='80' font-weight='300' letter-spacing='4' fill='%23ffffff'%3EZ%3C/text%3E%3C/svg%3E";

export const metadata: Metadata = {
  title: "ZANE",
  description: "Premium contemporary fashion by ZANE",
  icons: {
    icon: [{ url: faviconSvg, type: "image/svg+xml" }],
    apple: [{ url: appleIconSvg, type: "image/svg+xml", sizes: "180x180" }],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/svg+xml" href={faviconSvg} />
        <link rel="shortcut icon" href="/favicon.ico" />
      </head>
      <body>
        <AppProviders>
          <AnnouncementBar />
          <Navbar />
          <main className="min-h-screen">{children}</main>
          <Footer />
          <CartSidebar />
          <QuickViewModal />
        </AppProviders>
      </body>
    </html>
  );
}
