import type { Metadata } from "next";
import "./globals.css";
import { PostHogProvider } from "../providers/PostHogProvider";
import { UserProvider } from "../providers/UserProvider";

export const metadata: Metadata = {
  title: "Inkling",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* https://realfavicongenerator.net/ */}
        <link
          rel="icon"
          type="image/png"
          href="/favicon-96x96.png"
          sizes="96x96"
        />
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link
          rel="apple-touch-icon"
          sizes="180x180"
          href="/apple-touch-icon.png"
        />
        <meta name="apple-mobile-web-app-title" content="Inkling" />
        <link rel="manifest" href="/site.webmanifest" />
      </head>
      <body>
        <UserProvider>
          <PostHogProvider>{children}</PostHogProvider>
        </UserProvider>
      </body>
    </html>
  );
}
