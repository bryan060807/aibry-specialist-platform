import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://specialists.aibry.shop"),
  title: "AIBRY Specialist Platform | Catalog OS",
  description: "A coordinated platform of focused AI specialists with controlled authority, shared standards, and complete accountability.",
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "AIBRY Specialist Platform",
    title: "AIBRY Specialist Platform | Catalog OS",
    description: "A coordinated platform of focused AI specialists with controlled authority, shared standards, and complete accountability.",
  },
  twitter: {
    card: "summary",
    title: "AIBRY Specialist Platform | Catalog OS",
    description: "A coordinated platform of focused AI specialists with controlled authority, shared standards, and complete accountability.",
  },
  icons: {
    icon: [{ url: "/favicon.svg", type: "image/svg+xml" }],
    shortcut: "/favicon.svg",
  },
  manifest: "/site.webmanifest",
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
