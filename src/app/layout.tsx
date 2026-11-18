import MenuWindows from '@/components/menu-app/menu-windows'
import { PieDePagina } from '@/components/pie-de-pagina/pie-de-pagina'
import { Toaster } from '@/components/ui/sonner'
import { cn } from '@/lib/utils'
import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

export const metadata: Metadata = {
  title: 'cambiar-nombres-videos-ui',
  description: 'Renombra y numera vídeos en lote con vista previa.',
}

export const viewport: Viewport = {
  themeColor: '#dc7702',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className={cn('antialiased', 'font-sans', inter.variable)}>
      <body className="h-screen overflow-hidden flex flex-col">
        <MenuWindows />

        <main className="flex-1 overflow-auto bg-muted/40">{children}</main>

        <PieDePagina />

        <Toaster richColors closeButton position="top-center" offset={56} />
      </body>
    </html>
  )
}
