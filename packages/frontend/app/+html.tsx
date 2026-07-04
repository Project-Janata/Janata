import { ScrollViewStyleReset } from 'expo-router/html'

// This file is web-only and used to configure the root HTML for every
// web page during static rendering.
// The contents of this function only run in Node.js environments and
// do not have access to the DOM or browser APIs.
export default function Root({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <title>Chinmaya Janata — Connect with Your Chinmaya Community</title>

        {/* SEO meta tags */}
        <meta
          name="description"
          content="Chinmaya Janata brings the Chinmaya Mission community together. Discover nearby centers, find events, and connect with fellow members."
        />
        <meta name="theme-color" content="#ea580c" />

        {/* Open Graph / Social sharing */}
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Chinmaya Janata" />
        <meta
          property="og:description"
          content="Discover nearby Chinmaya Mission centers, find events, and connect with your community."
        />
        <meta property="og:site_name" content="Chinmaya Janata" />

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content="Chinmaya Janata" />
        <meta
          name="twitter:description"
          content="Discover nearby Chinmaya Mission centers, find events, and connect with your community."
        />

        {/* Mobile-optimized viewport */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes, viewport-fit=cover"
        />

        {/* PWA and mobile app tags */}
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Janata" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/logo.png" />

        {/* Disable body scrolling on web. This makes ScrollView components work closer to how they do on native.
          However, body scrolling is often nice to have for mobile web. If you want to enable it, remove this line.
        */}
        <ScrollViewStyleReset />

        <style
          dangerouslySetInnerHTML={{
            __html:
              'body{background-color:#fff;margin:0;padding:0}@media(prefers-color-scheme:dark){body{background-color:#0A0A0A}}',
          }}
        />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inclusive+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
