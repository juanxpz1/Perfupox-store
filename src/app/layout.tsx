import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import { store } from "@/config/store";
import "./globals.css";

/** Inter autoalojada: equivalente cercano a San Francisco para Android y Windows. */
const inter = localFont({
  src: [
    { path: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2", style: "normal" },
    { path: "../../node_modules/@fontsource-variable/inter/files/inter-latin-wght-italic.woff2", style: "italic" },
  ],
  variable: "--font-inter",
  display: "swap",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.APP_URL ?? "http://localhost:3000"),
  title: { default: `${store.name} · ${store.tagline}`, template: `%s · ${store.name}` },
  description: store.description,
  openGraph: { siteName: `${store.name} ${store.tagline}`, locale: "es_CO", type: "website" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4efe6" },
    { media: "(prefers-color-scheme: dark)", color: "#12110f" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CO" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
