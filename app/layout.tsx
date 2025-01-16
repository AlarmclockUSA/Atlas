import './globals.css'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/contexts/AuthContext'
import { Metadata } from 'next'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: {
    default: 'ATLAS Training AI',
    template: '%s | ATLAS Training AI'
  },
  description: 'Experience lifelike voice conversations with ElevenLabs AI agents. Our cutting-edge technology brings real estate interactions to life.',
  keywords: ['ElevenLabs', 'Conversational AI', 'Voice Conversations', 'Real Estate', 'AI Agents'],
  authors: [{ name: 'Your Company Name' }],
  creator: 'Your Company Name',
  publisher: 'Your Company Name',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    title: 'ATLAS Training AI',
    description: 'Experience lifelike voice conversations with ElevenLabs AI agents. Our cutting-edge technology brings real estate interactions to life.',
    url: 'https://your-website-url.com',
    siteName: 'ATLAS Training AI',
    images: [
      {
        url: 'https://your-website-url.com/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'ATLAS Training AI',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ElevenLabs Conversational AI',
    description: 'Experience lifelike voice conversations with ElevenLabs AI agents. Our cutting-edge technology brings real estate interactions to life.',
    images: ['https://your-website-url.com/twitter-image.jpg'],
    creator: '@YourTwitterHandle',
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
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

export default function RootLayout({
 children,
}: {
 children: React.ReactNode
}) {
 return (
   <html lang="en" className="light">
     <body className={inter.className}>
       <AuthProvider>
         {children}
       </AuthProvider>
     </body>
   </html>
 )
}

