import { AntdRegistry } from "@ant-design/nextjs-registry";
import { GlobalModalProvider } from "@/components/GlobalModalProvider";
import { IOSOverscrollGuard } from "@/components/IOSOverscrollGuard";
import { RouteAwareIcp } from "@/components/RouteAwareIcp";
import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "welcome using whalebean",
  description: "鲸豆智能，AI 驱动生活美好。",
  icons: {
    icon: "logo.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AntdRegistry>
          <GlobalModalProvider>
            <IOSOverscrollGuard />
            {children}
            <RouteAwareIcp />
          </GlobalModalProvider>
        </AntdRegistry>
      </body>
    </html>
  );
}
