import type { Metadata } from "next";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { Toaster } from "react-hot-toast";
import CartProviderWrapper from "@/components/CartProviderWrapper";
import InitialLoader from "@/components/InitialLoader";

export const metadata: Metadata = {
  metadataBase: new URL('https://medixo-bd.vercel.app'),
  title: {
    default: 'Medixo',
    template: 'Medixo'
  },
  description: 'Medixo BD is the leading B2B wholesale medicine shop in Bangladesh. Shop owners can buy online medicine at the best prices with fast delivery and secure payment. Join the most reliable medicine marketplace today.',
  keywords: [
    'medixo',
    'medixo bd',
    'medicine shop',
    'online medicine',
    'b2b medicine shop',
    'wholesale medicine',
    'B2B pharmaceutical',
    'medicine supplier',
    'pharmacy supply',
    'drug trading',
    'buy medicine online',
    'medicine marketplace',
    'wholesale pharmacy',
    'medicine wholesale Bangladesh',
    'online pharmacy B2B',
    'medixo medicine'
  ],
  authors: [{ name: 'Shariful Islam Udoy' }],
  creator: 'Shariful Islam Udoy',
  publisher: 'Shariful Islam Udoy',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Medixo',
    description: 'Bangladesh’s most trusted B2B medicine shop. Buy online medicine at wholesale prices with easy delivery.',
    url: 'https://medixo-bd.vercel.app',
    siteName: 'Medixo',
    images: [
      {
        url: 'https://medixo-bd.vercel.app/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'Medixo BD - B2B Wholesale Medicine Shop',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Medixo',
    description: 'Shop owners can buy medicines at wholesale prices on Medixo BD, the leading B2B medicine marketplace.',
    images: ['https://medixo-bd.vercel.app/og-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  alternates: {
    canonical: '/',
  },
  category: 'Business',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="google-site-verification" content="N5bNK87ZMOqCOOPSk-nQWJROmWNnI9_EsShABtA8W6U" />
        {/* Additional meta tags for better SEO */}
        <meta name="application-name" content="Medixo BD" />
        <meta name="apple-mobile-web-app-title" content="Medixo" />
        <meta name="theme-color" content="#0f766e" />
      </head>
      <body cz-shortcut-listen="true">
        <SessionProviderWrapper>
          <CartProviderWrapper>
            <InitialLoader>
              {children}
              <Toaster position="top-right" />
            </InitialLoader>
          </CartProviderWrapper>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}