import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "EndoTrack",
  description:
    "Plataforma de apoyo clínico para personas con síntomas compatibles con endometriosis. Registrá síntomas, describí el dolor y generá reportes para tu médico.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${geist.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-rose-50 text-slate-800">
        {children}
      </body>
    </html>
  );
}
