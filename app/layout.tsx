import type { Metadata } from 'next';
import { Suspense } from 'react';
import { Cormorant_Garamond, DM_Sans } from 'next/font/google';
import { ClerkProvider } from '@clerk/nextjs';
import { RefineProvider } from '@/providers/refine-provider';
import { AppLayout } from '@/components/layout/AppLayout';
import '@/styles/globals.css';

const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['300', '400', '500', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant-garamond',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Sri Maadan Yatra Internal Tools',
  description: 'Quotation and internal ops workspace for Sri Maadan Yatra',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${dmSans.variable} ${cormorantGaramond.variable}`}>
      <body className={dmSans.className}>
        <ClerkProvider>
          <RefineProvider>
            <Suspense fallback={null}>
              <AppLayout>{children}</AppLayout>
            </Suspense>
          </RefineProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
