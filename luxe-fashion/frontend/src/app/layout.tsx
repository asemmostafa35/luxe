import type { Metadata } from "next";
import { AppProviders } from "@/components/providers/AppProviders";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import AnnouncementBar from "@/components/layout/AnnouncementBar";
import CartSidebar from "@/components/shop/CartSidebar";
import QuickViewModal from "@/components/shop/QuickViewModal";
import "@/styles/globals.css";

// ✅ FIX: Add favicon via Next.js Metadata API.
// Using an SVG data-URI favicon so no external file is required.
// The "LF" monogram matches the brand's text logo shown in the Navbar.
export const metadata: Metadata = {
  title: "Luxe Fashion",
  description: "Premium fashion collection",
  icons: {
    // SVG favicon — modern browsers prefer this; it scales perfectly at any size
    icon: [
      {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23111111'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='central' text-anchor='middle' font-family='Georgia%2C serif' font-size='14' font-weight='300' letter-spacing='1' fill='%23ffffff'%3ELF%3C/text%3E%3C/svg%3E",
        type: "image/svg+xml",
      },
    ],
    // Apple touch icon — shown on iOS home screen shortcuts
    apple: [
      {
        url: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 180 180'%3E%3Crect width='180' height='180' fill='%23111111'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='central' text-anchor='middle' font-family='Georgia%2C serif' font-size='80' font-weight='300' letter-spacing='4' fill='%23ffffff'%3ELF%3C/text%3E%3C/svg%3E",
        type: "image/svg+xml",
        sizes: "180x180",
      },
    ],
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
        {/*
         * ✅ FIX: Explicit <link> tag as a belt-and-suspenders fallback for
         * browsers that do not yet read the Metadata API icons field.
         * The SVG encodes a minimal "LF" monogram on a black background,
         * consistent with the brand's Navbar logo style.
         */}
        <link
          rel="icon"
          type="image/svg+xml"
          href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' fill='%23111111'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='central' text-anchor='middle' font-family='Georgia%2C serif' font-size='14' font-weight='300' letter-spacing='1' fill='%23ffffff'%3ELF%3C/text%3E%3C/svg%3E"
        />
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
