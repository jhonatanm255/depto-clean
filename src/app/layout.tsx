
import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/contexts/auth-context';
import { DataProvider } from '@/contexts/data-context';
import { Toaster } from "@/components/ui/toaster";

export const metadata: Metadata = {
  title: 'CleanSweep Manager - Gestión de Limpieza',
  description: 'Gestiona asignaciones de limpieza y sigue el progreso en tiempo real. Optimizada para administradores y empleadas.',
  manifest: '/manifest.json',
  applicationName: 'CleanSweep Manager',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CleanSweep',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'CleanSweep Manager',
    title: 'CleanSweep Manager - Gestión de Limpieza',
    description: 'Gestiona asignaciones de limpieza y sigue el progreso en tiempo real.',
  },
  twitter: {
    card: 'summary',
    title: 'CleanSweep Manager - Gestión de Limpieza',
    description: 'Gestiona asignaciones de limpieza y sigue el progreso en tiempo real.',
  },
};

export const viewport: Viewport = {
  themeColor: '#1D3658',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-CL">
      <head>
        {/* Fuentes */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
        
        {/* Iconos para diferentes dispositivos */}
        <link rel="icon" href="/logo.png" type="image/png" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icons/icon-72x72.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/icons/icon-72x72.png" />
        
        {/* iOS Meta Tags */}
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152x152.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-192x192.png" />
        <link rel="apple-touch-icon" sizes="167x167" href="/icons/icon-152x152.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CleanSweep" />
        
        {/* iOS Splash Screens - iPhone */}
        <link rel="apple-touch-startup-image" media="screen and (device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/iphone-14-pro-max-portrait.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/iphone-14-pro-portrait.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/iphone-13-portrait.png" />
        <link rel="apple-touch-startup-image" media="screen and (device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3) and (orientation: portrait)" href="/splash/iphone-x-portrait.png" />
        
        {/* Android/Chrome Meta Tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="application-name" content="CleanSweep" />
        
        {/* Microsoft Meta Tags */}
        <meta name="msapplication-TileColor" content="#1D3658" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* PWA Meta Tags */}
        <meta name="format-detection" content="telephone=no" />
      </head>
      <body className="font-body antialiased" suppressHydrationWarning>
        <AuthProvider>
          <DataProvider>
            {children}
            <Toaster />
          </DataProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
