import type { Metadata } from "next";

import "./globals.css";
import { NavBar } from "@/components/layout/NavBar";
import { Footer } from "@/components/layout/Footer";
import { MobileBottomNav } from "@/components/layout/NavBar";



export const metadata: Metadata = {
  title: {
    default: "ParkRanger — Where Communities Come Alive",
    template: "%s · ParkRanger",
  },
  description:
    "Find local parks, discover what's happening, and connect with your neighbourhood community.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://parkranger.ca"),
  openGraph: {
    siteName: "ParkRanger",
    type: "website",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <NavBar />
        <main className="flex-1 pb-16 md:pb-0">
          {children}
        </main>
        <Footer />
        <MobileBottomNav />
      </body>
    </html>
  );
}
