import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import CookieConsent from "@/components/CookieConsent";
import { ThemeProvider } from "@/components/ThemeProvider";
import { OmnibusBanner } from "@/components/OmnibusBanner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL('https://www.getactcomply.com'),
  alternates: { canonical: 'https://www.getactcomply.com' },
  title: {
    default: 'ActComply: EU AI Act Compliance Platform',
    template: '%s | ActComply',
  },
  description: 'Assess your AI systems against the EU AI Act in minutes. Automated risk classification, compliance checklist, and audit-ready documentation. Enforcement powers are live, Annex III high-risk obligations apply from 2 December 2027.',
  keywords: [
    'EU AI Act compliance',
    'EU AI Act compliance tool',
    'EU AI Act compliance platform',
    'EU AI Act risk classification',
    'EU AI Act checklist',
    'EU AI Act assessment',
    'AI Act compliance software',
    'high-risk AI systems',
    'AI regulation compliance',
    'GPAI compliance',
    'EU AI Act 2026',
    'EU AI Act enforcement',
    'Annex III high-risk obligations',
  ],
  authors: [{ name: 'ActComply', url: 'https://www.getactcomply.com' }],
  creator: 'ActComply',
  openGraph: {
    type: 'website',
    locale: 'en_GB',
    url: 'https://www.getactcomply.com',
    siteName: 'ActComply',
    title: 'ActComply: EU AI Act Compliance Platform',
    description: 'Assess your AI systems against the EU AI Act in minutes. Automated risk classification, compliance roadmap, and audit-ready documentation.',
    images: [{ url: '/opengraph-image', width: 1200, height: 630, alt: 'ActComply: EU AI Act Compliance Platform' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ActComply: EU AI Act Compliance Platform',
    description: 'Assess your AI systems against the EU AI Act in minutes. Enforcement powers are live now.',
    images: ['/opengraph-image'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <OmnibusBanner />
          {children}
          <CookieConsent />
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  );
}
