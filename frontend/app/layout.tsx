import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/ThemeContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "灵织",
  description: "灵织 IdeaWeave - 灵感的编织",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {  
  return (  
    <html lang="zh-CN">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>  
        <ThemeProvider>
          {children}  
        </ThemeProvider>
      </body>  
    </html>  
  );  
} 