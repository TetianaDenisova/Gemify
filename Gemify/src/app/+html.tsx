import { ScrollViewStyleReset } from "expo-router/html";
import type { PropsWithChildren } from "react";

import { colors } from "@/theme/colors";

/**
 * Wraps every statically rendered web page. Runs in Node during the export, so
 * it has no access to the DOM, to hooks, or to the app's React context.
 *
 * Everything here exists to make the exported site installable on a phone:
 * the manifest and the Apple-specific tags are what turn "Add to Home Screen"
 * into a standalone app rather than a Safari bookmark.
 */
export default function Root({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        {/* viewport-fit=cover lets the app paint under the notch, the way the
            native build does; safe-area insets keep content clear of it. */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />

        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content={colors.background} />
        <meta name="mobile-web-app-capable" content="yes" />

        {/* iOS reads its own tags rather than the manifest's display mode. */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Gemify" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />

        {/* Disables body scrolling on web, which makes ScrollViews work. */}
        <ScrollViewStyleReset />

        <style dangerouslySetInnerHTML={{ __html: backgroundStyle }} />
        <script dangerouslySetInnerHTML={{ __html: registerServiceWorker }} />
      </head>
      <body>{children}</body>
    </html>
  );
}

/** Paints the overscroll area, which sits outside React's root element. */
const backgroundStyle = `
body {
  background-color: ${colors.background};
}
`;

const registerServiceWorker = `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', function () {
    navigator.serviceWorker.register('/sw.js').catch(function () {});
  });
}
`;
