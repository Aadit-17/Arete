import type { Metadata } from "next";
import { DM_Sans, DM_Serif_Display } from "next/font/google";
import "./globals.css";

import { CosmosBackground } from "@/components/ui/CosmosBackground";
import { AppChrome } from "@/components/layout/AppChrome";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  variable: "--font-dm-serif",
  display: "swap",
  weight: ["400"],
});

export const metadata: Metadata = {
  title: "Arete",
  description: "Your personal agent for excellence. AI-guided life tracking and reflections.",
  icons: {
    icon: "/favicon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${dmSerifDisplay.variable}`}>
      <body className="antialiased selection:bg-cyan-500/20 selection:text-cyan-200 text-zinc-100 font-sans leading-relaxed tracking-[0.01em]">
        <CosmosBackground />

        <AppChrome>{children}</AppChrome>
      </body>
    </html>
  );
}
