import type { Metadata } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans, Inter } from "next/font/google";
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

// Chosen per area by the token layer: the marketing site and the auth pages
// are set in Inter, the console in IBM Plex Sans (see the
// [data-theme="enterprise"] block in globals.css, which re-points --font-sans
// and --font-mono below the console shell). Plex Mono serves both.
// Loaded as the variable font (no `weight` list): with a static weight list,
// Next 16.3's Turbopack production build fails to resolve the font files
// ("next/font/google queries have exactly one entry"). `next dev` is unaffected.
const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-plex-sans",
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
      className={`${inter.variable} ${plexMono.variable} ${plexSans.variable}`}
    >
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  );
}
