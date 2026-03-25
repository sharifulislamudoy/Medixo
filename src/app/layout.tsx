import type { Metadata } from "next";
import "./globals.css";
import SessionProviderWrapper from "@/components/SessionProviderWrapper";
import { Toaster } from "react-hot-toast";
import CartProviderWrapper from "@/components/CartProviderWrapper";
import InitialLoader from "@/components/InitialLoader";
import NotificationHandler from "@/components/NotificationHandler";

export const metadata: Metadata = {
  metadataBase: new URL('https://www.medimart.com'), // Replace with your domain
  title: {
    default: 'Medi Mart - B2B Pharmaceutical Marketplace',
    template: '%s | Medi Mart'
  },
  description: 'Bangladesh’s leading B2B wholesale medicine marketplace. Shop owners can purchase pharmaceuticals at the best prices with easy delivery and secure payment.',
  keywords: ['wholesale medicine', 'B2B pharmaceutical', 'medicine supplier', 'pharmacy supply', 'drug trading'],
  authors: [{ name: 'Medi Mart Team' }],
  creator: 'Medi Mart',
  publisher: 'Medi Mart',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'Medi Mart - B2B Pharmaceutical Marketplace',
    description: 'The most reliable platform for shop owners to buy medicines at competitive prices.',
    url: 'https://www.medimart.com',
    siteName: 'Medi Mart',
    images: [
      {
        url: 'https://www.medimart.com/og-image.jpg', // Your OG image URL
        width: 1200,
        height: 630,
        alt: 'Medi Mart - B2B Pharmaceutical Marketplace',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Medi Mart - B2B Pharmaceutical Marketplace',
    description: 'Shop owners can buy medicines at wholesale prices.',
    images: ['https://www.medimart.com/twitter-image.jpg'],
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
  manifest: '/site.webmanifest',
  verification: {
    google: 'your-google-search-console-verification-code',
    // Add other verification codes if needed
  },
  alternates: {
    canonical: 'https://www.medimart.com',
    languages: {
      'en-US': 'https://www.medimart.com/en',
      'bn-BD': 'https://www.medimart.com/bn', // If you have a Bengali version
    },
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
      </head>
      <body
        cz-shortcut-listen="true">
        <SessionProviderWrapper>
          <CartProviderWrapper>
            <InitialLoader>
              {children}
              <NotificationHandler />
              <Toaster position="top-right" />
            </InitialLoader>
          </CartProviderWrapper>
        </SessionProviderWrapper>
      </body>
    </html>
  );
}