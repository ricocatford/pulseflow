import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PulseFlow",
  description: "AI-native scraping engine that monitors web signals and triggers LLM-summarized alerts",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
