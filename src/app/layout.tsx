import "@/styles/globals.css";

import { type Metadata } from "next";
import { Geist } from "next/font/google";
import QueryProvider from "@/components/providers/query-provider";

export const metadata: Metadata = {
  title: "Arthur GenAI Admin",
  description: "Arthur GenAI Engine Administration Dashboard",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${geist.variable}`}>
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
