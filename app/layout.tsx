import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "التمايز | منصة تعلم ذكية",
  description: "منصة ذكية تساعد المعلم على تقديم تجارب تعلم متمايزة وفق تشخيص الطلاب وتقدمهم."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
