import type { Metadata } from "next";
import "./globals.css";
import { UserProvider } from "../providers/UserProvider";
import { getTodaysGameIndex } from "../hooks/game-logic";
import { GAMES } from "../../public/game_data";

export async function generateMetadata(): Promise<Metadata> {
  const game = GAMES[getTodaysGameIndex()];

  return {
    title: "Inkling",
    description: `Solve daily puzzles inspired by pictionary!`,
    keywords:
      "rebus puzzles, pictionary, word games, brain games, visual puzzles, daily puzzles, wordplay, logic games, puzzle games",
    authors: [{ name: "Inkling Team" }],
    creator: "Owen",
    publisher: "Inkling",
    robots: "index, follow",
    openGraph: {
      title: "Inkling",
      description: `Solve daily puzzles inspired by pictionary!`,
      type: "website",
      url: "https://inkling-puzzle.com",
      siteName: "Inkling",
      images: [
        {
          url: game.image,
          width: 1200,
          height: 630,
          alt: `Today's Inkling puzzle`,
        },
      ],
      locale: "en_US",
    },
    alternates: {
      canonical: "https://inkling-puzzle.com",
    },
    category: "games",
    classification: "puzzle game",
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
      </head>
      <body>
        <UserProvider>{children}</UserProvider>
      </body>
    </html>
  );
}
