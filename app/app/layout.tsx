import type { Metadata } from "next";
import { Space_Grotesk, Source_Serif_4 } from "next/font/google";
import "./globals.css";

import { CosmosBackground } from "@/components/ui/CosmosBackground";
import { Navbar } from "@/components/ui/Navbar";

// Space Grotesk: Modern geometric sans-serif inspired by Styrene (Anthropic's headline font)
const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

// Source Serif 4: Contemporary serif matching Anthropic's sophisticated aesthetic
const sourceSerif = Source_Serif_4({
  subsets: ["latin"],
  variable: "--font-serif",
  display: "swap",
  weight: ["400", "500", "600", "700"],
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
    <html lang="en" className={`${spaceGrotesk.variable} ${sourceSerif.variable}`}>
      <body className="antialiased selection:bg-cyan-500/20 selection:text-cyan-200 bg-[#020202] text-zinc-100 font-sans">
        <CosmosBackground />

        <Navbar />

        <main className="pt-24 pb-32 lg:pb-0 min-h-screen relative z-10">
          {children}
        </main>
      </body>
    </html>
  );
}
