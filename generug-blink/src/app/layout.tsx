import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "GeneRUG Actions and Blinks",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head />
      <body
        className={
          (cn("min-h-screen bg-background font-sans antialiased"),
          inter.className)
        }
      >
        <div className="flex flex-col">
          <main className={"flex-1 space-y-10 max-w-screen-xl mx-auto"}>
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
