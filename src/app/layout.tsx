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
  description: 'Bangladesh’s leading B2B wholesale medicine marketplace. Shop owners can purchase pharmaceuticals at the best prices with easy delivery and secure payment.',
  keywords: ['wholesale medicine', 'B2B pharmaceutical', 'medicine supplier', 'pharmacy supply', 'drug trading'],
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
    description: 'The most reliable platform for shop owners to buy medicines at competitive prices.',
    url: 'https://medixo-bd.vercel.app',
    siteName: 'Medixo',
    images: [
      {
        url: 'https://medixo-bd.vercel.app/og-image.jpg', // Your OG image URL
        width: 1200,
        height: 630,
        alt: 'Medixo',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Medixo',
    description: 'Shop owners can buy medicines at wholesale prices.',
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
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
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
      </head>
      <body
        cz-shortcut-listen="true">
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
