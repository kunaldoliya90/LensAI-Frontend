import type { Metadata } from "next";
import { Geist, Geist_Mono, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

// Two families, loaded once at the root and chosen per area by the token layer:
// the console is set in Geist, the marketing site and the auth pages in Inter.
// See the [data-theme="light"] block in globals.css, which re-points --font-sans
// and --font-mono for everything below the console shell.
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

const geistMono = Geist_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-geist-mono",
  display: "swap",
});

const DESCRIPTION =
  "Submit a document and the values you expect. LensAI extracts, compares, and POSTs a signed verdict to your endpoint. We never connect to your database.";

export const metadata: Metadata = {
  title: {
    default: "LensAI — document verification API",
    template: "%s · LensAI",
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "LensAI",
    title: "LensAI — document verification API",
    description: DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "LensAI — document verification API",
    description: DESCRIPTION,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${plexMono.variable} ${geist.variable} ${geistMono.variable}`}
    >
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
