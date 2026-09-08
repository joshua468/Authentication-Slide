import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const fontPrimary = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-family-primary",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: {
    default: "Aura Shield | Enterprise Authentication",
    template: "%s | Aura Shield",
  },
  description: "Next-generation secure, accessible authentication platform.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fontPrimary.variable}>
      <body className="min-h-screen bg-slate-50 font-sans text-slate-900 antialiased selection:bg-emerald-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}