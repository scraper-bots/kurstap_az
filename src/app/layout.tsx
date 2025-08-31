import type { Metadata } from 'next'
import { Inter, Poppins, Space_Grotesk } from 'next/font/google'
import { ClerkProvider } from '@clerk/nextjs'
import './globals.css'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter'
})

const poppins = Poppins({ 
  weight: ['400', '500', '600', '700', '800', '900'],
  subsets: ['latin'],
  variable: '--font-poppins'
})

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk'
})

export const metadata: Metadata = {
  metadataBase: new URL('https://www.bir.guru'),
  title: 'Bir Guru | Master Every Interview With AI',
  description: 'Practice with realistic interview scenarios, get instant feedback, and land the job you want. Join 15,000+ professionals improving their interview skills.',
  keywords: 'AI interview coach, interview practice, job interview preparation, AI feedback, career coaching, technical interviews, behavioral questions',
  authors: [{ name: 'Bir Guru' }],
  creator: 'Bir Guru',
  publisher: 'Bir Guru',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
    viewportFit: 'cover'
  },
  robots: {
    index: true,
    follow: true,
  },
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '16x16 32x32' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/manifest.json',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://www.bir.guru',
    title: 'Bir Guru | Master Every Interview With AI',
    description: 'Practice with realistic interview scenarios, get instant feedback, and land the job you want.',
    siteName: 'Bir Guru',
    images: [
      {
        url: '/icon-512.png',
        width: 512,
        height: 512,
        alt: 'Bir Guru Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bir Guru | Master Every Interview With AI',
    description: 'Practice with realistic interview scenarios, get instant feedback, and land the job you want.',
    creator: '@birguru',
    images: ['/icon-512.png'],
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={`${inter.variable} ${poppins.variable} ${spaceGrotesk.variable}`}>
        <body className={inter.className}>{children}</body>
      </html>
    </ClerkProvider>
  )
}