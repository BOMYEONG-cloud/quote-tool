import type { Metadata } from "next";
import { Geist_Mono } from "next/font/google";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { PostHogProvider } from "@/components/providers/posthog-provider";
import "./globals.css";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "견적노트",
  description: "견적/단가 통합 관리 SaaS",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className={`${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <PostHogProvider>
          <Header />
          <div className="min-w-0 flex-1">{children}</div>
          <Footer />
        </PostHogProvider>
      </body>
    </html>
  );
}
