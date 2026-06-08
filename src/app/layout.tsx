import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/lib/auth-provider";
import { DataProvider } from "@/lib/data-provider";

const inter = Inter({ subsets: ["latin"], display: "swap" });

export const metadata: Metadata = {
  title: "Verklisti bygginga",
  description: "To do kerfi fyrir byggingarfyrirtæki",
  manifest: "/manifest.json"
};

export const viewport: Viewport = {
  themeColor: "#17202a",
  width: "device-width",
  initialScale: 1
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="is">
      <body className={`${inter.className} antialiased`}>
        <AuthProvider>
          <DataProvider>{children}</DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
