import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "../providers/UserProvider";
import { getTodaysGameIndex } from "../hooks/game-logic";
import { GAMES } from "../../public/game_data";
import { PostHogProvider } from "@/providers/PostHogProvider";

export async function generateMetadata(): Promise<Metadata> {
  const game = GAMES[getTodaysGameIndex()];
  const imageUrl = `https://inkling-puzzle.com${game.image}`;
  const title = `Inkling`;
  const description = `Can you guess today's word? Each image represents one or more concepts, which when combined form the answer.`;

  return {
    title,
    description,
    keywords:
      "rebus puzzles, pictionary, word games, brain games, visual puzzles, daily puzzles, wordplay, logic games, puzzle games",
    authors: [{ name: "Inkling Team" }],
    creator: "Owen",
    publisher: "Inkling",
    robots: "index, follow",
    openGraph: {
      title,
      description,
      type: "website",
      url: "https://inkling-puzzle.com",
      siteName: "Inkling",
      images: [
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `Inkling #${game.id} - Can you guess today's word?`,
        },
      ],
      locale: "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [imageUrl],
      site: "@inkling_puzzle",
      creator: "@inkling_puzzle",
    },
    alternates: {
      canonical: "https://inkling-puzzle.com",
    },
    category: "games",
    other: {
      "msapplication-TileImage": "/file.svg",
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        {/* Basic icons and PWA */}
        <link rel="icon" type="image/svg+xml" href="/file.svg" />
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />

        {/* Theme and viewport */}
        <meta name="theme-color" content="#1976d2" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        {/* PWA settings */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Inkling" />
        <meta name="application-name" content="Inkling" />
        <meta name="msapplication-TileColor" content="#1976d2" />

        {/* Disable unwanted features */}
        <meta name="format-detection" content="telephone=no" />

        {/* Structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "Inkling",
              description: "Daily visual word puzzles inspired by pictionary",
              url: "https://inkling-puzzle.com",
              applicationCategory: "Game",
              operatingSystem: "Web Browser",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              publisher: {
                "@type": "Organization",
                name: "Inkling Team",
              },
            }),
          }}
        />
      </head>
      <body>
        <PostHogProvider>
          <UserProvider>{children}</UserProvider>
        </PostHogProvider>
      </body>
    </html>
  );
}
