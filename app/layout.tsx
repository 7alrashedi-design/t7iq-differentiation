import "./globals.css";
import type { Metadata } from "next";
import { Noto_Kufi_Arabic, Noto_Sans_Arabic } from "next/font/google";

const kufi = Noto_Kufi_Arabic({
  subsets: ["arabic"],
  variable: "--font-kufi",
  display: "swap",
  weight: ["400","500","600","700","800"]
});

const sans = Noto_Sans_Arabic({
  subsets: ["arabic"],
  variable: "--font-sans-ar",
  display: "swap",
  weight: ["400","500","600","700","800"]
});

export const metadata: Metadata = {
  title: "التمايز | منصة تعلم ذكية",
  description: "منصة ذكية تنقل التمايز من التدريب إلى التطبيق والأثر."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className={`${kufi.variable} ${sans.variable}`}>{children}</body>
    </html>
  );
}
