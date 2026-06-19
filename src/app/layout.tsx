import { Inter, Michroma } from "next/font/google";
import type { Metadata, Viewport } from "next";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StripDevBrowserAttrs from "@/components/StripDevBrowserAttrs";
import { getCurrentTheme } from "@/lib/theme";
import ThemeVariables from "@/components/ThemeVariables";
import Providers from "@/components/Providers";
import "./globals.css";

const theme = getCurrentTheme();

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
    icon: theme.logo,
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
