import { Inter, Michroma } from "next/font/google";
import type { Metadata, Viewport } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StripDevBrowserAttrs from "@/components/StripDevBrowserAttrs";
import ThemeVariables from "@/components/ThemeVariables";
import Providers from "@/components/Providers";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const michroma = Michroma({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-michroma",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: "DeadEgos | Have No Enemies",
  description:
    "Official DeadEgos clothing. Streetwear with purpose. Have no enemies.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    shortcut: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${michroma.variable}`} suppressHydrationWarning>
      <head>
        <StripDevBrowserAttrs />
        <ThemeVariables />
      </head>
      <body className="min-h-screen antialiased">
        <Providers>
          <Navbar />
          <main className="min-h-screen pt-[65px] sm:pt-[72px]">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
