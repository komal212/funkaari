import type { Metadata } from "next";
import { Nunito, Quicksand } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { BlobBackground } from "@/components/BlobBackground";

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
  weight: ["500", "600", "700"],
});

const nunito = Nunito({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Funkaari — Make every little moment count",
  description:
    "Discover the best workshops, playdates, classes, and weekend adventures for children aged 6 months to 6 years in Bengaluru—all in one place.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${quicksand.variable} ${nunito.variable} min-h-screen flex flex-col relative`}
      >
        <BlobBackground />
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <Script id="va-init" strategy="afterInteractive">
          {`window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };`}
        </Script>
        <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}
