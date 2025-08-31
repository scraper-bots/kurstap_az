import type { Metadata } from 'next'
import { Inter, Poppins, Space_Grotesk } from 'next/font/google'
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
  title: 'AI Interview Coach | Ace Your Next Interview With AI',
  description: 'Practice with realistic interview scenarios, get instant feedback, and land the job you want. Join 10,000+ job seekers improving their interview skills.',
  keywords: 'AI interview coach, interview practice, job interview preparation, AI feedback, career coaching',
  authors: [{ name: 'AI Interview Coach' }],
  creator: 'AI Interview Coach',
  publisher: 'AI Interview Coach',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://aiinterviewcoach.com',
    title: 'AI Interview Coach | Ace Your Next Interview With AI',
    description: 'Practice with realistic interview scenarios, get instant feedback, and land the job you want.',
    siteName: 'AI Interview Coach',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AI Interview Coach | Ace Your Next Interview With AI',
    description: 'Practice with realistic interview scenarios, get instant feedback, and land the job you want.',
    creator: '@aiinterviewcoach',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${poppins.variable} ${spaceGrotesk.variable}`}>
      <body className={inter.className}>{children}</body>
    </html>
  )
}