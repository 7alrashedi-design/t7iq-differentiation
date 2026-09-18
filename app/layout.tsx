import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "T7IQ | منصة التمايز الذكية",
  description: "مخطط تعلم ذكي يساعد المعلم على تقديم تجارب تعلم متمايزة وفق تقدم الطلاب."
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
