import type { Metadata } from "next";
import {
  Inter,
  Playfair_Display,
  Outfit,
  Cormorant_Garamond,
  Cinzel,
  Amiri,
  Cairo,
  Tajawal,
  Alexandria,
  Plus_Jakarta_Sans,
  Montserrat,
  Marhey,
  Bebas_Neue,
  Readex_Pro,
  DM_Serif_Display,
  El_Messiri,
  Prata,
} from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});

const playfair = Playfair_Display({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-playfair",
});

const outfit = Outfit({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-outfit",
});

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "500", "600", "700"],
  variable: "--font-cormorant",
});

const cinzel = Cinzel({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "600", "700", "800"],
  variable: "--font-cinzel",
});

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  display: "swap",
  weight: ["400", "700"],
  variable: "--font-amiri",
});

const cairo = Cairo({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-cairo",
});

const tajawal = Tajawal({
  subsets: ["arabic"],
  display: "swap",
  weight: ["400", "500", "700"],
  variable: "--font-tajawal",
});

const alexandria = Alexandria({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-alexandria",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-jakarta",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  display: "swap",
  weight: ["400", "700", "900"],
  variable: "--font-montserrat",
});

const marhey = Marhey({
  subsets: ["arabic"],
  display: "swap",
  variable: "--font-marhey",
});

const bebas = Bebas_Neue({
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  variable: "--font-bebas",
});

const readex = Readex_Pro({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-readex",
});

const dmSerif = DM_Serif_Display({
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  variable: "--font-dm-serif",
});

const elMessiri = El_Messiri({
  subsets: ["arabic", "latin"],
  display: "swap",
  weight: ["400", "600", "700"],
  variable: "--font-el-messiri",
});

const prata = Prata({
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  variable: "--font-prata",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")
  ),
  title: {
    default: "DZMenu — Elevate Your Restaurant's Dining Experience",
    template: "%s | DZMenu",
  },
  description:
    "Premium, instant digital menus accessible via dynamic QR codes. Update items and prices in real-time with no app required.",
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${outfit.variable} ${cormorant.variable} ${cinzel.variable} ${amiri.variable} ${cairo.variable} ${tajawal.variable} ${alexandria.variable} ${jakarta.variable} ${montserrat.variable} ${marhey.variable} ${bebas.variable} ${readex.variable} ${dmSerif.variable} ${elMessiri.variable} ${prata.variable} scroll-smooth`}
    >
      <body className="min-h-screen bg-slate-950 font-sans text-slate-100 antialiased selection:bg-amber-500/20 selection:text-amber-300">
        {children}
      </body>
    </html>
  );
}
